import { Transaction } from '../../domain/entities';
import { DecisionAction, RiskAssessment } from '../../domain/services/risk-engine';
import { RiskEvidenceValue } from '../../domain/value-objects';
import { ReplayTransaction } from './transaction-replay.repository';

export interface ScoreSignalRecord {
  code: string;
  score: number;
  message: string;
  evidence: Record<string, RiskEvidenceValue>;
}

export interface ScoreTransactionResult {
  transactionId: string;
  decisionId: string;
  alertId: string | null;
  challengeId: string | null;
  riskScore: number;
  action: DecisionAction;
  signals: readonly ScoreSignalRecord[];
  ruleVersion: string;
  processingTimeMs: number;
}

export interface SaveScoreInput {
  decisionId: string;
  transaction: Transaction;
  assessment: RiskAssessment;
  processingTimeUs: number;
}

export interface ScoringRepository {
  findDecision(transactionId: string, ruleVersion: string): Promise<ScoreTransactionResult | null>;
  loadReferenceData(transaction: Transaction): Promise<ReplayTransaction | null>;
  save(input: SaveScoreInput): Promise<ScoreTransactionResult>;
}

export const SCORING_REPOSITORY = Symbol('SCORING_REPOSITORY');
