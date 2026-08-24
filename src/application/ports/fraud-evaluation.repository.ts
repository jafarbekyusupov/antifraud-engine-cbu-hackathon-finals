export interface FraudPrediction {
  transactionId: string;
  riskScore: number;
  reasons: readonly string[];
}

export interface FraudPredictionRepository {
  listBlocked(ruleVersion: string): Promise<readonly FraudPrediction[]>;
  countTransactions(): Promise<number>;
}

export const FRAUD_PREDICTION_REPOSITORY = Symbol('FRAUD_PREDICTION_REPOSITORY');

export interface FraudLabel {
  transactionId: string;
  pattern: string;
}

export interface FraudLabelReader {
  readPositiveLabels(): AsyncIterable<FraudLabel>;
}

export const FRAUD_LABEL_READER = Symbol('FRAUD_LABEL_READER');
