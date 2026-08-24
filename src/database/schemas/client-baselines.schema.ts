import { doublePrecision, integer, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { clients } from './clients.schema';

export const clientBaselines = pgTable('client_baselines', {
  clientId: varchar('client_id', { length: 6 })
    .primaryKey()
    .references(() => clients.id, { onDelete: 'cascade' }),
  sampleCount: integer('sample_count').default(0).notNull(),
  amountMean: doublePrecision('amount_mean').default(0).notNull(),
  amountM2: doublePrecision('amount_m2').default(0).notNull(),
  amountMedian: doublePrecision('amount_median'),
  amountQ1: doublePrecision('amount_q1'),
  amountQ3: doublePrecision('amount_q3'),
  frequentCities: jsonb('frequent_cities').$type<Record<string, number>>().default({}).notNull(),
  frequentMccs: jsonb('frequent_mccs').$type<Record<string, number>>().default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ClientBaselineRow = typeof clientBaselines.$inferSelect;
export type NewClientBaselineRow = typeof clientBaselines.$inferInsert;
