import { Transaction } from '../../../entities';
import { RiskSignal } from '../../../value-objects';
import { RiskContext } from '../risk-context';
import { RiskRule } from '../risk-rule';

const LEGITIMATE_LARGE_PURCHASE_CATEGORIES = new Set(['Elektronika', 'Mehmonxona']);

export class AmountAnomalyRule implements RiskRule {
  readonly code = 'AMOUNT_ANOMALY';

  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null {
    const { baseline } = context;
    if (baseline.sampleCount < 10 || baseline.amountQ1 === null || baseline.amountQ3 === null) {
      return null;
    }

    const interquartileRange = Math.max(1, baseline.amountQ3 - baseline.amountQ1);
    const deviation = (transaction.amount - baseline.amountQ3) / interquartileRange;
    if (deviation < 3) {
      return null;
    }

    let score = deviation >= 8 ? 70 : deviation >= 5 ? 55 : 40;
    const incomeRatio = transaction.amount / Math.max(1, context.client.monthlyIncome);
    const limitRatio = transaction.amount / Math.max(1, context.card.dailyLimit);

    if (incomeRatio >= 1) score += 8;
    if (limitRatio >= 0.8) score += 8;
    if (context.merchant.riskLevel === 'HIGH') score += 8;
    if (LEGITIMATE_LARGE_PURCHASE_CATEGORIES.has(context.merchant.category)) score -= 15;

    score = Math.max(25, Math.min(85, score));
    return RiskSignal.create({
      code: this.code,
      score,
      message: `Amount is ${deviation.toFixed(1)} IQRs above this customer's normal range`,
      evidence: {
        amount: transaction.amount,
        median: baseline.amountMedian,
        q1: baseline.amountQ1,
        q3: baseline.amountQ3,
        iqrDeviation: Number(deviation.toFixed(2)),
        incomeRatio: Number(incomeRatio.toFixed(2)),
        cardLimitRatio: Number(limitRatio.toFixed(2)),
      },
    });
  }
}
