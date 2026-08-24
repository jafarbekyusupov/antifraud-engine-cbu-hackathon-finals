import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { decisionActionEnum } from './enums.schema';
import { transactions } from './transactions.schema';

export interface RiskSignalDocument {
  code: string;
  score: number;
  message: string;
  evidence: Record<string, boolean | number | string | null>;
}

export const decisions = pgTable(
  'decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: varchar('transaction_id', { length: 9 })
      .notNull()
      .references(() => transactions.id, { onDelete: 'restrict' }),
    riskScore: smallint('risk_score').notNull(),
    action: decisionActionEnum('action').notNull(),
    signals: jsonb('signals').$type<RiskSignalDocument[]>().notNull(),
    ruleVersion: varchar('rule_version', { length: 30 }).notNull(),
    processingTimeUs: integer('processing_time_us').notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check('decisions_risk_score_check', sql`${table.riskScore} between 0 and 100`),
    uniqueIndex('decisions_transaction_rule_version_uidx').on(
      table.transactionId,
      table.ruleVersion,
    ),
    index('decisions_decided_at_idx').on(table.decidedAt),
  ],
);

export type DecisionRow = typeof decisions.$inferSelect;
export type NewDecisionRow = typeof decisions.$inferInsert;
