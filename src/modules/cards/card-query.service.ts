import { Inject, Injectable } from '@nestjs/common';
import {
  CARD_QUERY_REPOSITORY,
  CardQueryRepository,
  CustomerCardListItem,
  OperatorCardListItem,
} from '../../application/ports/card-query.repository';
import { CustomerCardQueryDto, OperatorCardQueryDto } from './dto/card-query.dto';

export interface OperatorCardPage {
  items: readonly OperatorCardListItem[];
  nextCursor: string | null;
}

export interface CustomerCardPage {
  items: readonly CustomerCardListItem[];
  nextCursor: string | null;
}

@Injectable()
export class CardQueryService {
  constructor(@Inject(CARD_QUERY_REPOSITORY) private readonly cards: CardQueryRepository) {}

  async listOperator(query: OperatorCardQueryDto): Promise<OperatorCardPage> {
    const rows = await this.cards.listOperator({
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.cursor ? { cursor: { id: query.cursor } } : {}),
      limit: query.limit + 1,
    });
    return this.toPage(rows, query.limit);
  }

  async listCustomer(clientId: string, query: CustomerCardQueryDto): Promise<CustomerCardPage> {
    const rows = await this.cards.listCustomer(clientId, {
      ...(query.cursor ? { cursor: { id: query.cursor } } : {}),
      limit: query.limit + 1,
    });
    return this.toPage(rows, query.limit);
  }

  private toPage<T extends { cardId: string }>(
    rows: readonly T[],
    limit: number,
  ): { items: readonly T[]; nextCursor: string | null } {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? (items.at(-1)?.cardId ?? null) : null };
  }
}
