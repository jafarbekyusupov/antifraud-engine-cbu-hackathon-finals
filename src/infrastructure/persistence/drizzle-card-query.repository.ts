import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, SQL } from 'drizzle-orm';
import {
  CardFilters,
  CardQueryRepository,
  CustomerCardListItem,
  OperatorCardListItem,
} from '../../application/ports/card-query.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { cards, clients } from '../../database/schemas';

@Injectable()
export class DrizzleCardQueryRepository implements CardQueryRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async listOperator(filters: CardFilters): Promise<readonly OperatorCardListItem[]> {
    const rows = await this.database
      .select({ card: cards, clientName: clients.fullName })
      .from(cards)
      .innerJoin(clients, eq(clients.id, cards.clientId))
      .where(this.where(filters))
      .orderBy(asc(cards.id))
      .limit(filters.limit);

    return rows.map(({ card, clientName }) => ({
      cardId: card.id,
      clientId: card.clientId,
      clientName,
      type: card.type,
      currency: card.currency,
      openedAt: card.openedAt,
      dailyLimit: card.dailyLimit,
    }));
  }

  async listCustomer(
    clientId: string,
    filters: CardFilters,
  ): Promise<readonly CustomerCardListItem[]> {
    const rows = await this.database
      .select({ card: cards })
      .from(cards)
      .where(and(eq(cards.clientId, clientId), ...this.whereParts(filters)))
      .orderBy(asc(cards.id))
      .limit(filters.limit);

    return rows.map(({ card }) => ({
      cardId: card.id,
      type: card.type,
      currency: card.currency,
      openedAt: card.openedAt,
      dailyLimit: card.dailyLimit,
    }));
  }

  private where(filters: CardFilters): SQL | undefined {
    const parts = this.whereParts(filters);
    return parts.length > 0 ? and(...parts) : undefined;
  }

  private whereParts(filters: CardFilters): SQL[] {
    const parts: SQL[] = [];
    if (filters.clientId) parts.push(eq(cards.clientId, filters.clientId));
    if (filters.cursor) parts.push(gt(cards.id, filters.cursor.id));
    return parts;
  }
}
