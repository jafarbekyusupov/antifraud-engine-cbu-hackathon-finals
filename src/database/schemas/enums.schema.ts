import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender', ['M', 'F']);
export const clientSegmentEnum = pgEnum('client_segment', ['STANDARD', 'YOUNG', 'PREMIUM']);
export const cardTypeEnum = pgEnum('card_type', ['UZCARD', 'HUMO', 'VISA', 'MASTERCARD']);
export const merchantRiskLevelEnum = pgEnum('merchant_risk_level', ['LOW', 'MEDIUM', 'HIGH']);
export const transactionChannelEnum = pgEnum('transaction_channel', ['ATM', 'ECOM', 'P2P', 'POS']);
export const transactionResponseEnum = pgEnum('transaction_response', ['OK', 'DECLINED']);
export const decisionActionEnum = pgEnum('decision_action', ['APPROVE', 'STEP_UP', 'BLOCK']);
export const alertStatusEnum = pgEnum('alert_status', [
  'OPEN',
  'CONFIRMED',
  'FALSE_POSITIVE',
  'CLOSED',
]);
export const caseStatusEnum = pgEnum('case_status', [
  'OPEN',
  'INVESTIGATING',
  'CONFIRMED',
  'FALSE_POSITIVE',
  'CLOSED',
]);
export const caseEventTypeEnum = pgEnum('case_event_type', [
  'CASE_OPENED',
  'STATUS_CHANGED',
  'NOTE_ADDED',
]);
export const replayJobStatusEnum = pgEnum('replay_job_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);
export const securityChallengeStatusEnum = pgEnum('security_challenge_status', [
  'PENDING',
  'VERIFIED',
  'DENIED',
  'REVIEW_REQUIRED',
  'EXPIRED',
]);
export const securityChallengeDecisionEnum = pgEnum('security_challenge_decision', [
  'CONFIRM',
  'DENY',
]);
export const securityChallengeResolutionEnum = pgEnum('security_challenge_resolution', [
  'ALLOW',
  'BLOCK',
  'REVIEW',
]);
