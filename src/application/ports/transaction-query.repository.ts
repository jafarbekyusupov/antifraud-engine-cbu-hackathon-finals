import { ScoreSignalRecord } from './scoring.repository';

export type TransactionChannel = 'ATM' | 'ECOM' | 'P2P' | 'POS';
export type TransactionResponse = 'OK' | 'DECLINED';
export type TransactionAction = 'APPROVE' | 'STEP_UP' | 'BLOCK';
export type CustomerVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'DENIED'
  | 'REVIEW_REQUIRED'
  | 'EXPIRED';

export interface TransactionCursor {
  occurredAt: Date;
  id: string;
}

export interface TransactionFilters {
  clientId?: string;
  cardId?: string;
  merchantId?: string;
  channel?: TransactionChannel;
  response?: TransactionResponse;
  action?: TransactionAction;
  from?: Date;
  to?: Date;
  minimumAmount?: number;
  maximumAmount?: number;
  minimumRiskScore?: number;
  cursor?: TransactionCursor;
  limit: number;
}

export interface TransactionListItem {
  transactionId: string;
  cardId: string;
  clientId: string;
  clientName: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  occurredAt: Date;
  city: string;
  channel: TransactionChannel;
  response: TransactionResponse;
  mcc: string;
  riskScore: number | null;
  action: TransactionAction | null;
  signalCodes: readonly string[];
  alertId: string | null;
  alertStatus: 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED' | null;
  customerVerificationStatus: CustomerVerificationStatus | null;
}

export interface TransactionDetail extends TransactionListItem {
  latitude: number;
  longitude: number;
  merchantCategory: string;
  merchantCity: string;
  merchantRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  ruleVersion: string | null;
  signals: readonly ScoreSignalRecord[];
  caseId: string | null;
  caseStatus: 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED' | null;
  customerVerification: {
    challengeId: string;
    status: CustomerVerificationStatus;
    expiresAt: Date;
    respondedAt: Date | null;
    customerDecision: 'CONFIRM' | 'DENY' | null;
    resolution: 'ALLOW' | 'BLOCK' | 'REVIEW' | null;
    checks: {
      locationMatch: boolean;
      timezoneMatch: boolean;
      clockMatch: boolean;
      clockSkewSeconds: number;
      distanceKm: number;
    } | null;
  } | null;
}

export interface CustomerTransactionListItem {
  transactionId: string;
  merchantName: string;
  amount: number;
  currency: string;
  occurredAt: Date;
  city: string;
  channel: TransactionChannel;
  response: TransactionResponse;
  verificationStatus: CustomerVerificationStatus | null;
}

export interface CustomerTransactionDetail extends CustomerTransactionListItem {
  cardId: string;
  merchantCategory: string;
  merchantCity: string;
  mcc: string;
  latitude: number;
  longitude: number;
  verification: {
    status: CustomerVerificationStatus;
    expiresAt: Date;
    respondedAt: Date | null;
    resolution: 'ALLOW' | 'BLOCK' | 'REVIEW' | null;
  } | null;
}

export interface TransactionQueryRepository {
  listOperator(filters: TransactionFilters): Promise<readonly TransactionListItem[]>;
  findOperator(id: string): Promise<TransactionDetail | null>;
  listCustomer(clientId: string, filters: TransactionFilters): Promise<readonly CustomerTransactionListItem[]>;
  findCustomer(id: string, clientId: string): Promise<CustomerTransactionDetail | null>;
}

export const TRANSACTION_QUERY_REPOSITORY = Symbol('TRANSACTION_QUERY_REPOSITORY');
