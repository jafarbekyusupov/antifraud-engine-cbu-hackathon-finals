import { evaluateFraudPredictions } from './fraud-evaluation';

describe('evaluateFraudPredictions', () => {
  it('calculates confusion counts, F1, and pattern recall', () => {
    const result = evaluateFraudPredictions({
      totalTransactions: 5,
      predictedIds: new Set(['T1', 'T2']),
      actualPatterns: new Map([
        ['T1', 'velocity'],
        ['T3', 'ring'],
      ]),
    });

    expect(result).toMatchObject({
      truePositive: 1,
      falsePositive: 1,
      falseNegative: 1,
      trueNegative: 2,
      precision: 0.5,
      recall: 0.5,
      f1: 0.5,
      patternRecall: {
        ring: { actual: 1, detected: 0, recall: 0 },
        velocity: { actual: 1, detected: 1, recall: 1 },
      },
    });
  });
});
