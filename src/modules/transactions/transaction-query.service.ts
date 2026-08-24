import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import {
  CustomerTransactionDetail,
  CustomerTransactionListItem,
  TRANSACTION_QUERY_REPOSITORY,
  TransactionDetail,
  TransactionFilters,
  TransactionListItem,
  TransactionQueryRepository,
} from '../../application/ports/transaction-query.repository';
import {
  CustomerTransactionQueryDto,
  OperatorTransactionQueryDto,
} from './dto/transaction-query.dto';

const operatorCursorSchema = z.strictObject({
  occurredAt: z.iso.datetime(),
  id: z.string().regex(/^T\d{8}$/),
});

export interface TransactionPage {
  items: readonly TransactionListItem[];
  nextCursor: string | null;
}

export interface CustomerTransactionPage {
  items: readonly CustomerTransactionListItem[];
  nextCursor: string | null;
}

@Injectable()
export class TransactionQueryService {
  constructor(
    @Inject(TRANSACTION_QUERY_REPOSITORY)
    private readonly transactions: TransactionQueryRepository,
  ) {}

  async listOperator(query: OperatorTransactionQueryDto): Promise<TransactionPage> {
    const rows = await this.transactions.listOperator({
      ...this.toFilters(query),
      limit: query.limit + 1,
      cursor: query.cursor ? this.decodeCursor(query.cursor) : undefined,
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return { items, nextCursor: hasMore ? this.encodeCursor(items.at(-1)?.occurredAt, items.at(-1)?.transactionId) : null };
  }

  async detailOperator(id: string): Promise<TransactionDetail> {
    const transaction = await this.transactions.findOperator(id);
    if (!transaction) throw new NotFoundException(`Transaction ${id} was not found`);
    return transaction;
  }

  async listCustomer(
    clientId: string,
    query: CustomerTransactionQueryDto,
  ): Promise<CustomerTransactionPage> {
    const rows = await this.transactions.listCustomer(clientId, {
      ...this.toFilters(query),
      limit: query.limit + 1,
      cursor: query.cursor ? this.decodeCursor(query.cursor) : undefined,
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return { items, nextCursor: hasMore ? this.encodeCursor(items.at(-1)?.occurredAt, items.at(-1)?.transactionId) : null };
  }

  async detailCustomer(id: string, clientId: string): Promise<CustomerTransactionDetail> {
    const transaction = await this.transactions.findCustomer(id, clientId);
    if (!transaction) throw new NotFoundException(`Transaction ${id} was not found`);
    return transaction;
  }

  private toFilters(query: OperatorTransactionQueryDto | CustomerTransactionQueryDto): TransactionFilters {
    return {
      ...(query.from ? { from: new Date(query.from) } : {}),
      ...(query.to ? { to: new Date(query.to) } : {}),
      ...('clientId' in query && query.clientId ? { clientId: query.clientId } : {}),
      ...('cardId' in query && query.cardId ? { cardId: query.cardId } : {}),
      ...('merchantId' in query && query.merchantId ? { merchantId: query.merchantId } : {}),
      ...('channel' in query && query.channel ? { channel: query.channel } : {}),
      ...('response' in query && query.response ? { response: query.response } : {}),
      ...('action' in query && query.action ? { action: query.action } : {}),
      ...('minimumAmount' in query && query.minimumAmount !== undefined
        ? { minimumAmount: query.minimumAmount }
        : {}),
      ...('maximumAmount' in query && query.maximumAmount !== undefined
        ? { maximumAmount: query.maximumAmount }
        : {}),
      ...('minimumRiskScore' in query && query.minimumRiskScore !== undefined
        ? { minimumRiskScore: query.minimumRiskScore }
        : {}),
      limit: query.limit,
    };
  }

  private decodeCursor(value: string): { occurredAt: Date; id: string } {
    try {
      const parsed = operatorCursorSchema.parse(
        JSON.parse(Buffer.from(value, 'base64url').toString('utf8')),
      );
      return { occurredAt: new Date(parsed.occurredAt), id: parsed.id };
    } catch {
      throw new BadRequestException('Invalid transaction cursor');
    }
  }

  private encodeCursor(date: Date | undefined, id: string | undefined): string | null {
    if (!date || !id) return null;
    return Buffer.from(JSON.stringify({ occurredAt: date.toISOString(), id })).toString('base64url');
  }
}
