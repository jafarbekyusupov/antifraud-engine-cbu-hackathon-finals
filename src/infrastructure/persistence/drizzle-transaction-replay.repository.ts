import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, or } from 'drizzle-orm';
import {
  ReplayCursor,
  ReplayTransaction,
  TransactionReplayRepository,
} from '../../application/ports/transaction-replay.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { cards, clients, merchants, transactions } from '../../database/schemas';
import { Transaction } from '../../domain/entities';
import { GeoPoint } from '../../domain/value-objects';

@Injectable()
export class DrizzleTransactionReplayRepository implements TransactionReplayRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async readAfter(
    cursor: ReplayCursor | null,
    limit: number,
  ): Promise<readonly ReplayTransaction[]> {
    const cursorCondition = cursor
      ? or(
          gt(transactions.occurredAt, cursor.occurredAt),
          and(
            eq(transactions.occurredAt, cursor.occurredAt),
            gt(transactions.id, cursor.transactionId),
          ),
        )
      : undefined;

    const rows = await this.database
      .select()
      .from(transactions)
      .innerJoin(clients, eq(clients.id, transactions.clientId))
      .innerJoin(cards, eq(cards.id, transactions.cardId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .where(cursorCondition)
      .orderBy(asc(transactions.occurredAt), asc(transactions.id))
      .limit(limit);

    return rows.map((row) => ({
      transaction: Transaction.create({
        id: row.transactions.id,
        cardId: row.transactions.cardId,
        clientId: row.transactions.clientId,
        occurredAt: row.transactions.occurredAt,
        amount: row.transactions.amount,
        currency: row.transactions.currency,
        merchantId: row.transactions.merchantId,
        mcc: row.transactions.mcc,
        city: row.transactions.city,
        location: GeoPoint.create(row.transactions.latitude, row.transactions.longitude),
        channel: row.transactions.channel,
        response: row.transactions.response,
      }),
      client: {
        monthlyIncome: row.clients.monthlyIncome,
        openedAt: row.clients.openedAt,
        segment: row.clients.segment,
        homeCity: row.clients.homeCity,
      },
      card: {
        dailyLimit: row.cards.dailyLimit,
        openedAt: row.cards.openedAt,
        type: row.cards.type,
      },
      merchant: {
        category: row.merchants.category,
        city: row.merchants.city,
        riskLevel: row.merchants.riskLevel,
      },
    }));
  }
}
