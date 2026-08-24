import { bigint, date, index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { clientSegmentEnum, genderEnum } from './enums.schema';

export const clients = pgTable(
  'clients',
  {
    id: varchar('id', { length: 6 }).primaryKey(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    gender: genderEnum('gender').notNull(),
    birthYear: integer('birth_year').notNull(),
    region: varchar('region', { length: 50 }).notNull(),
    homeCity: varchar('home_city', { length: 50 }).notNull(),
    openedAt: date('opened_at', { mode: 'date' }).notNull(),
    monthlyIncome: bigint('monthly_income', { mode: 'number' }).notNull(),
    segment: clientSegmentEnum('segment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('clients_segment_idx').on(table.segment)],
);

export type ClientRow = typeof clients.$inferSelect;
export type NewClientRow = typeof clients.$inferInsert;
