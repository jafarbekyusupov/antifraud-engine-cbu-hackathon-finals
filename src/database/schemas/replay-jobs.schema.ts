import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { replayJobStatusEnum } from './enums.schema';

export const replayJobs = pgTable('replay_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: replayJobStatusEnum('status').default('PENDING').notNull(),
  totalRows: integer('total_rows').default(0).notNull(),
  processedRows: integer('processed_rows').default(0).notNull(),
  alertsCreated: integer('alerts_created').default(0).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export type ReplayJobRow = typeof replayJobs.$inferSelect;
export type NewReplayJobRow = typeof replayJobs.$inferInsert;
