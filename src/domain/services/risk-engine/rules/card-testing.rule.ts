import { Transaction } from '../../../entities';
import { RiskSignal } from '../../../value-objects';
import { RiskContext } from '../risk-context';
import { RiskRule } from '../risk-rule';

const WINDOW_MS = 15 * 60 * 1_000;

export class CardTestingRule implements RiskRule {
  readonly code = 'CARD_TESTING';

  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null {
    const windowStart = transaction.occurredAt.getTime() - WINDOW_MS;
    const smallAmountCeiling = Math.max(
      50_000,
      Math.min(250_000, (context.baseline.amountMedian ?? 500_000) * 0.25),
    );
    const attempts = context.recentCardTransactions.filter(
      (candidate) =>
        candidate.occurredAt.getTime() >= windowStart && candidate.amount <= smallAmountCeiling,
    );
    if (transaction.amount <= smallAmountCeiling) {
      attempts.push(transaction);
    }

    const declinedCount = attempts.filter((candidate) => candidate.response === 'DECLINED').length;
    const distinctMerchants = new Set(attempts.map((candidate) => candidate.merchantId)).size;
    const followedBySuccess = transaction.response === 'OK' && declinedCount >= 2;

    if (attempts.length < 3 || (!followedBySuccess && declinedCount < 3 && distinctMerchants < 3)) {
      return null;
    }

    const score = Math.min(
      85,
      45 +
        declinedCount * 7 +
        Math.max(0, distinctMerchants - 1) * 4 +
        (followedBySuccess ? 10 : 0),
    );
    return RiskSignal.create({
      code: this.code,
      score,
      message: 'A burst of small card-verification attempts was detected',
      evidence: {
        attemptCount: attempts.length,
        declinedCount,
        distinctMerchants,
        followedBySuccess,
        smallAmountCeiling: Math.round(smallAmountCeiling),
        windowMinutes: 15,
      },
    });
  }
}
