import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { alerts } from './alerts.schema';
import { caseEventTypeEnum, caseStatusEnum } from './enums.schema';

export const investigationCases = pgTable(
  'cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    alertId: uuid('alert_id')
      .notNull()
      .references(() => alerts.id, { onDelete: 'restrict' }),
    status: caseStatusEnum('status').default('OPEN').notNull(),
    note: text('note'),
    openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('cases_alert_id_uidx').on(table.alertId),
    index('cases_status_updated_at_idx').on(table.status, table.updatedAt),
  ],
);

export const caseEvents = pgTable(
  'case_events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => investigationCases.id, { onDelete: 'restrict' }),
    eventType: caseEventTypeEnum('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, boolean | number | string | null>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('case_events_case_created_at_idx').on(table.caseId, table.createdAt)],
);

export type InvestigationCaseRow = typeof investigationCases.$inferSelect;
export type NewInvestigationCaseRow = typeof investigationCases.$inferInsert;
export type CaseEventRow = typeof caseEvents.$inferSelect;
export type NewCaseEventRow = typeof caseEvents.$inferInsert;
