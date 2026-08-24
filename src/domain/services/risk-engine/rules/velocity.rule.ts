import { Transaction } from '../../../entities';
import { RiskSignal } from '../../../value-objects';
import { RiskContext } from '../risk-context';
import { RiskRule } from '../risk-rule';

const WINDOW_MS = 10 * 60 * 1_000;

export class VelocityRule implements RiskRule {
  readonly code = 'VELOCITY';

  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null {
    const windowStart = transaction.occurredAt.getTime() - WINDOW_MS;
    const recent = context.recentCardTransactions.filter(
      (candidate) =>
        candidate.occurredAt.getTime() >= windowStart &&
        candidate.occurredAt.getTime() <= transaction.occurredAt.getTime(),
    );
    const transactionCount = recent.length + 1;

    if (transactionCount < 5) {
      return null;
    }

    const sameMerchant = recent.every(
      (candidate) => candidate.merchantId === transaction.merchantId,
    );
    const baselineSmallAmount = Math.max(context.baseline.amountMedian ?? 0, 500_000);
    const allSmallAmounts =
      recent.every((candidate) => candidate.amount <= baselineSmallAmount) &&
      transaction.amount <= baselineSmallAmount;

    // The dataset explicitly includes legitimate split bills: 5–8 small payments at one merchant.
    if (sameMerchant && allSmallAmounts && transactionCount <= 8) {
      return null;
    }

    const distinctMerchants = new Set([
      ...recent.map((candidate) => candidate.merchantId),
      transaction.merchantId,
    ]).size;
    const declinedCount =
      recent.filter((candidate) => candidate.response === 'DECLINED').length +
      (transaction.response === 'DECLINED' ? 1 : 0);
    const score = Math.min(
      80,
      30 + (transactionCount - 5) * 8 + Math.min(distinctMerchants - 1, 3) * 5 + declinedCount * 3,
    );

    return RiskSignal.create({
      code: this.code,
      score,
      message: `${transactionCount} transactions were attempted on this card within 10 minutes`,
      evidence: { transactionCount, distinctMerchants, declinedCount, windowMinutes: 10 },
    });
  }
}
