import { Transaction } from '../../domain/entities';
import {
  CardRiskProfile,
  ClientRiskProfile,
  MerchantRiskProfile,
} from '../../domain/services/risk-engine';

export interface ReplayCursor {
  occurredAt: Date;
  transactionId: string;
}

export interface ReplayTransaction {
  transaction: Transaction;
  client: ClientRiskProfile;
  card: CardRiskProfile;
  merchant: MerchantRiskProfile;
}

export interface TransactionReplayRepository {
  readAfter(cursor: ReplayCursor | null, limit: number): Promise<readonly ReplayTransaction[]>;
}

export const TRANSACTION_REPLAY_REPOSITORY = Symbol('TRANSACTION_REPLAY_REPOSITORY');
