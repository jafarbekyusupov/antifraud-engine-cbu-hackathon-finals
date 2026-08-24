import { bigint, doublePrecision, index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { cards } from './cards.schema';
import { clients } from './clients.schema';
import { transactionChannelEnum, transactionResponseEnum } from './enums.schema';
import { merchants } from './merchants.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: varchar('id', { length: 9 }).primaryKey(),
    cardId: varchar('card_id', { length: 7 })
      .notNull()
      .references(() => cards.id, { onDelete: 'restrict' }),
    clientId: varchar('client_id', { length: 6 })
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    merchantId: varchar('merchant_id', { length: 6 })
      .notNull()
      .references(() => merchants.id, { onDelete: 'restrict' }),
    mcc: varchar('mcc', { length: 4 }).notNull(),
    city: varchar('city', { length: 50 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    channel: transactionChannelEnum('channel').notNull(),
    response: transactionResponseEnum('response').notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('transactions_client_occurred_at_idx').on(table.clientId, table.occurredAt),
    index('transactions_card_occurred_at_idx').on(table.cardId, table.occurredAt),
    index('transactions_merchant_occurred_at_idx').on(table.merchantId, table.occurredAt),
    index('transactions_occurred_at_idx').on(table.occurredAt),
  ],
);

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
