export interface FraudEvaluationInput {
  totalTransactions: number;
  predictedIds: ReadonlySet<string>;
  actualPatterns: ReadonlyMap<string, string>;
}

export interface FraudEvaluationResult {
  totalTransactions: number;
  predictedFraud: number;
  actualFraud: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
  precision: number;
  recall: number;
  f1: number;
  patternRecall: Record<string, { actual: number; detected: number; recall: number }>;
  falsePositiveSample: readonly string[];
  falseNegativeSample: readonly string[];
}

export function evaluateFraudPredictions(input: FraudEvaluationInput): FraudEvaluationResult {
  const actualIds = new Set(input.actualPatterns.keys());
  const truePositiveIds = [...input.predictedIds].filter((id) => actualIds.has(id));
  const falsePositiveIds = [...input.predictedIds].filter((id) => !actualIds.has(id)).sort();
  const falseNegativeIds = [...actualIds].filter((id) => !input.predictedIds.has(id)).sort();
  const truePositive = truePositiveIds.length;
  const falsePositive = falsePositiveIds.length;
  const falseNegative = falseNegativeIds.length;
  const precision = divide(truePositive, truePositive + falsePositive);
  const recall = divide(truePositive, truePositive + falseNegative);
  const f1 = divide(2 * precision * recall, precision + recall);

  const patternTotals = new Map<string, { actual: number; detected: number }>();
  for (const [transactionId, pattern] of input.actualPatterns) {
    const current = patternTotals.get(pattern) ?? { actual: 0, detected: 0 };
    current.actual += 1;
    if (input.predictedIds.has(transactionId)) current.detected += 1;
    patternTotals.set(pattern, current);
  }

  return {
    totalTransactions: input.totalTransactions,
    predictedFraud: input.predictedIds.size,
    actualFraud: actualIds.size,
    truePositive,
    falsePositive,
    falseNegative,
    trueNegative: Math.max(
      0,
      input.totalTransactions - truePositive - falsePositive - falseNegative,
    ),
    precision: rounded(precision),
    recall: rounded(recall),
    f1: rounded(f1),
    patternRecall: Object.fromEntries(
      [...patternTotals.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([pattern, counts]) => [
          pattern,
          { ...counts, recall: rounded(divide(counts.detected, counts.actual)) },
        ]),
    ),
    falsePositiveSample: falsePositiveIds.slice(0, 50),
    falseNegativeSample: falseNegativeIds.slice(0, 50),
  };
}

function divide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function rounded(value: number): number {
  return Number(value.toFixed(6));
}
