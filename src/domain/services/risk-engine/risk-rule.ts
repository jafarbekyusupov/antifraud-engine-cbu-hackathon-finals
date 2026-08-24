import { Transaction } from '../../entities';
import { RiskSignal } from '../../value-objects';
import { RiskContext } from './risk-context';

export interface RiskRule {
  readonly code: string;
  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null;
}
