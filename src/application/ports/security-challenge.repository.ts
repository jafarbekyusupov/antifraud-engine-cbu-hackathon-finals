import { DeviceVerificationChecks } from '../../domain/services/customer-verification';

export type SecurityChallengeStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'DENIED'
  | 'REVIEW_REQUIRED'
  | 'EXPIRED';
export type CustomerChallengeDecision = 'CONFIRM' | 'DENY';
export type ChallengeResolution = 'ALLOW' | 'BLOCK' | 'REVIEW';

export interface SecurityChallengeSummary {
  id: string;
  status: SecurityChallengeStatus;
  merchantName: string;
  amount: number;
  currency: string;
  occurredAt: Date;
  city: string;
  channel: 'ATM' | 'ECOM' | 'P2P' | 'POS';
  expiresAt: Date;
}

export interface SecurityChallengeDetail extends SecurityChallengeSummary {
  transactionId: string;
  transactionLatitude: number;
  transactionLongitude: number;
}

export type ChallengeChecks = DeviceVerificationChecks;

export interface ChallengeResponseRecord {
  challengeId: string;
  status: Exclude<SecurityChallengeStatus, 'PENDING'>;
  resolution: ChallengeResolution;
  checks: ChallengeChecks;
  respondedAt: Date;
}

export interface SaveChallengeResponseInput {
  challengeId: string;
  clientId: string;
  idempotencyKey: string;
  decision: CustomerChallengeDecision;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timezoneName: string;
  utcOffsetMinutes: number;
  deviceTimestamp: Date;
  status: Exclude<SecurityChallengeStatus, 'PENDING' | 'EXPIRED'>;
  resolution: ChallengeResolution;
  checks: ChallengeChecks;
}

export type SaveChallengeResponseResult =
  | { kind: 'ok'; value: ChallengeResponseRecord }
  | { kind: 'not-found' }
  | { kind: 'expired' }
  | { kind: 'already-responded'; value: ChallengeResponseRecord };

export interface SecurityChallengeRepository {
  listForClient(clientId: string): Promise<readonly SecurityChallengeSummary[]>;
  findForClient(id: string, clientId: string): Promise<SecurityChallengeDetail | null>;
  saveResponse(input: SaveChallengeResponseInput): Promise<SaveChallengeResponseResult>;
}

export const SECURITY_CHALLENGE_REPOSITORY = Symbol('SECURITY_CHALLENGE_REPOSITORY');
