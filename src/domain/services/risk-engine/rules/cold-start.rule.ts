import { Transaction } from '../../../entities';
import { RiskSignal } from '../../../value-objects';
import { RiskContext } from '../risk-context';
import { RiskRule } from '../risk-rule';

export class ColdStartRule implements RiskRule {
  readonly code = 'COLD_START';

  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null {
    const accountAgeDays =
      (transaction.occurredAt.getTime() - context.client.openedAt.getTime()) /
      (24 * 60 * 60 * 1_000);
    const isColdStart = accountAgeDays <= 90 || context.baseline.sampleCount < 10;
    if (!isColdStart) {
      return null;
    }

    const incomeRatio = transaction.amount / Math.max(1, context.client.monthlyIncome);
    const cardLimitRatio = transaction.amount / Math.max(1, context.card.dailyLimit);
    const awayFromHome = transaction.isPhysical() && transaction.city !== context.client.homeCity;
    const highRiskMerchant = context.merchant.riskLevel === 'HIGH';
    const indicators =
      Number(incomeRatio >= 0.75) +
      Number(cardLimitRatio >= 0.75) +
      Number(awayFromHome) +
      Number(highRiskMerchant) +
      Number(transaction.response === 'DECLINED');

    if (indicators < 2) {
      return null;
    }

    return RiskSignal.create({
      code: this.code,
      score: Math.min(70, 25 + indicators * 9),
      message:
        'High-risk behavior was detected before a reliable personal baseline was established',
      evidence: {
        accountAgeDays: Math.max(0, Math.floor(accountAgeDays)),
        historySampleCount: context.baseline.sampleCount,
        incomeRatio: Number(incomeRatio.toFixed(2)),
        cardLimitRatio: Number(cardLimitRatio.toFixed(2)),
        awayFromHome,
        highRiskMerchant,
      },
    });
  }
}
