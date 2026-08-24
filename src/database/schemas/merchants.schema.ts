import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { merchantRiskLevelEnum } from './enums.schema';

export const merchants = pgTable(
  'merchants',
  {
    id: varchar('id', { length: 6 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    mcc: varchar('mcc', { length: 4 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    city: varchar('city', { length: 50 }).notNull(),
    riskLevel: merchantRiskLevelEnum('risk_level').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('merchants_mcc_idx').on(table.mcc)],
);

export type MerchantRow = typeof merchants.$inferSelect;
export type NewMerchantRow = typeof merchants.$inferInsert;
