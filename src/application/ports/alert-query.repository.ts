import { ScoreSignalRecord } from './scoring.repository';

export type AlertStatus = 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED';

export interface AlertCursor {
  createdAt: Date;
  id: string;
}

export interface AlertFilters {
  status?: AlertStatus;
  clientId?: string;
  minimumRiskScore?: number;
  cursor?: AlertCursor;
  limit: number;
}

export interface AlertListItem {
  id: string;
  transactionId: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  merchantName: string;
  city: string;
  riskScore: number;
  status: AlertStatus;
  action: 'APPROVE' | 'STEP_UP' | 'BLOCK';
  signalCodes: readonly string[];
  occurredAt: Date;
  createdAt: Date;
}

export interface AlertDetail extends AlertListItem {
  cardId: string;
  channel: 'ATM' | 'ECOM' | 'P2P' | 'POS';
  response: 'OK' | 'DECLINED';
  mcc: string;
  latitude: number;
  longitude: number;
  ruleVersion: string;
  signals: readonly ScoreSignalRecord[];
  caseId: string | null;
  caseStatus: 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED' | null;
  customerVerification: {
    challengeId: string;
    status: 'PENDING' | 'VERIFIED' | 'DENIED' | 'REVIEW_REQUIRED' | 'EXPIRED';
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

export interface AlertQueryRepository {
  list(filters: AlertFilters): Promise<readonly AlertListItem[]>;
  findById(id: string): Promise<AlertDetail | null>;
}

export const ALERT_QUERY_REPOSITORY = Symbol('ALERT_QUERY_REPOSITORY');
