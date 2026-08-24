import {
  index,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clients } from './clients.schema';
import { decisions } from './decisions.schema';
import { alertStatusEnum } from './enums.schema';
import { transactions } from './transactions.schema';

export const alerts = pgTable(
  'alerts',
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
    riskScore: smallint('risk_score').notNull(),
    status: alertStatusEnum('status').default('OPEN').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('alerts_decision_id_uidx').on(table.decisionId),
    index('alerts_status_created_at_idx').on(table.status, table.createdAt),
    index('alerts_client_created_at_idx').on(table.clientId, table.createdAt),
    index('alerts_risk_score_idx').on(table.riskScore),
  ],
);

export type AlertRow = typeof alerts.$inferSelect;
export type NewAlertRow = typeof alerts.$inferInsert;
