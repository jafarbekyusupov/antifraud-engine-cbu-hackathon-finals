import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatasetImportRepository } from '../../application/ports/dataset-import.repository';
import {
  CardImportRecord,
  ClientImportRecord,
  MerchantImportRecord,
} from '../../application/ports/dataset-reader.port';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { cards, clients, merchants, transactions } from '../../database/schemas';
import { Transaction } from '../../domain/entities';

@Injectable()
export class DrizzleDatasetImportRepository implements DatasetImportRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async upsertClients(records: readonly ClientImportRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.database
      .insert(clients)
      .values(records.map((record) => ({ ...record })))
      .onConflictDoUpdate({
        target: clients.id,
        set: {
          fullName: sql`excluded.full_name`,
          gender: sql`excluded.gender`,
          birthYear: sql`excluded.birth_year`,
          region: sql`excluded.region`,
          homeCity: sql`excluded.home_city`,
          openedAt: sql`excluded.opened_at`,
          monthlyIncome: sql`excluded.monthly_income`,
          segment: sql`excluded.segment`,
        },
      });
  }

  async upsertCards(records: readonly CardImportRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.database
      .insert(cards)
      .values(records.map((record) => ({ ...record })))
      .onConflictDoUpdate({
        target: cards.id,
        set: {
          clientId: sql`excluded.client_id`,
          type: sql`excluded.type`,
          currency: sql`excluded.currency`,
          openedAt: sql`excluded.opened_at`,
          dailyLimit: sql`excluded.daily_limit`,
        },
      });
  }

  async upsertMerchants(records: readonly MerchantImportRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.database
      .insert(merchants)
      .values(records.map((record) => ({ ...record })))
      .onConflictDoUpdate({
        target: merchants.id,
        set: {
          name: sql`excluded.name`,
          mcc: sql`excluded.mcc`,
          category: sql`excluded.category`,
          city: sql`excluded.city`,
          riskLevel: sql`excluded.risk_level`,
        },
      });
  }

  async insertTransactions(records: readonly Transaction[]): Promise<void> {
    if (records.length === 0) return;
    await this.database
      .insert(transactions)
      .values(
        records.map((record) => ({
          id: record.id,
          cardId: record.cardId,
          clientId: record.clientId,
          occurredAt: record.occurredAt,
          amount: record.amount,
          currency: record.currency,
          merchantId: record.merchantId,
          mcc: record.mcc,
          city: record.city,
          latitude: record.location.latitude,
          longitude: record.location.longitude,
          channel: record.channel,
          response: record.response,
        })),
      )
      .onConflictDoNothing({ target: transactions.id });
  }
}
