import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clients } from './clients.schema';
import { decisions } from './decisions.schema';
import {
  securityChallengeDecisionEnum,
  securityChallengeResolutionEnum,
  securityChallengeStatusEnum,
} from './enums.schema';
import { transactions } from './transactions.schema';

export const securityChallenges = pgTable(
  'security_challenges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    decisionId: uuid('decision_id')
      .notNull()
      .references(() => decisions.id, { onDelete: 'restrict' }),
    transactionId: varchar('transaction_id', { length: 9 })
      .notNull()
      .references(() => transactions.id, { onDelete: 'restrict' }),
    clientId: varchar('client_id', { length: 6 })
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    status: securityChallengeStatusEnum('status').default('PENDING').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('security_challenges_decision_id_uidx').on(table.decisionId),
    index('security_challenges_client_status_created_idx').on(
      table.clientId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const securityChallengeResponses = pgTable(
  'security_challenge_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => securityChallenges.id, { onDelete: 'restrict' }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    decision: securityChallengeDecisionEnum('decision').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracyMeters: doublePrecision('accuracy_meters').notNull(),
    timezoneName: varchar('timezone_name', { length: 100 }).notNull(),
    utcOffsetMinutes: smallint('utc_offset_minutes').notNull(),
    deviceTimestamp: timestamp('device_timestamp', { withTimezone: true }).notNull(),
    locationMatch: boolean('location_match').notNull(),
    timezoneMatch: boolean('timezone_match').notNull(),
    clockMatch: boolean('clock_match').notNull(),
    clockSkewSeconds: integer('clock_skew_seconds').notNull(),
    distanceKm: doublePrecision('distance_km').notNull(),
    resolution: securityChallengeResolutionEnum('resolution').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('security_challenge_responses_challenge_uidx').on(table.challengeId),
    uniqueIndex('security_challenge_responses_idempotency_uidx').on(
      table.challengeId,
      table.idempotencyKey,
    ),
  ],
);

export type SecurityChallengeRow = typeof securityChallenges.$inferSelect;
export type SecurityChallengeResponseRow = typeof securityChallengeResponses.$inferSelect;
