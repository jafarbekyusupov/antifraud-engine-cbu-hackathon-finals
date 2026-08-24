export type CardType = 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD';

export interface CardCursor {
  id: string;
}

export interface CardFilters {
  clientId?: string;
  cursor?: CardCursor;
  limit: number;
}

export interface OperatorCardListItem {
  cardId: string;
  clientId: string;
  clientName: string;
  type: CardType;
  currency: string;
  openedAt: Date;
  dailyLimit: number;
}

export interface CustomerCardListItem {
  cardId: string;
  type: CardType;
  currency: string;
  openedAt: Date;
  dailyLimit: number;
}

export interface CardQueryRepository {
  listOperator(filters: CardFilters): Promise<readonly OperatorCardListItem[]>;
  listCustomer(clientId: string, filters: CardFilters): Promise<readonly CustomerCardListItem[]>;
}

export const CARD_QUERY_REPOSITORY = Symbol('CARD_QUERY_REPOSITORY');
