import { bigint, date, index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { clients } from './clients.schema';
import { cardTypeEnum } from './enums.schema';

export const cards = pgTable(
  'cards',
  {
    id: varchar('id', { length: 7 }).primaryKey(),
    clientId: varchar('client_id', { length: 6 })
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    type: cardTypeEnum('type').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    openedAt: date('opened_at', { mode: 'date' }).notNull(),
    dailyLimit: bigint('daily_limit', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('cards_client_id_idx').on(table.clientId)],
);

export type CardRow = typeof cards.$inferSelect;
export type NewCardRow = typeof cards.$inferInsert;
