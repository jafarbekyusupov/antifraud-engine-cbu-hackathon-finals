import { Transaction } from '../../domain/entities';
import { RiskContext } from '../../domain/services/risk-engine';
import { ReplayTransaction } from './transaction-replay.repository';

export interface RiskStateStore {
  contextFor(item: ReplayTransaction): RiskContext;
  record(transaction: Transaction): void;
  reset(): void;
}

export const RISK_STATE_STORE = Symbol('RISK_STATE_STORE');
