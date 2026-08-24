import { Transaction } from '../../domain/entities';
import { RiskAssessment } from '../../domain/services/risk-engine';

export interface ScoredTransaction {
  decisionId: string;
  transaction: Transaction;
  assessment: RiskAssessment;
  processingTimeUs: number;
}

export interface DecisionBatchRepository {
  save(records: readonly ScoredTransaction[]): Promise<{ decisions: number; alerts: number }>;
}

export const DECISION_BATCH_REPOSITORY = Symbol('DECISION_BATCH_REPOSITORY');
