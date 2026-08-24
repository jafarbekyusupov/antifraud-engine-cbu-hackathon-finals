import { GeoPoint } from '../value-objects';

export type TransactionChannel = 'ATM' | 'ECOM' | 'P2P' | 'POS';
export type TransactionResponse = 'OK' | 'DECLINED';

export interface TransactionProps {
  id: string;
  cardId: string;
  clientId: string;
  occurredAt: Date;
  amount: number;
  currency: string;
  merchantId: string;
  mcc: string;
  city: string;
  location: GeoPoint;
  channel: TransactionChannel;
  response: TransactionResponse;
}

export class Transaction {
  readonly id: string;
  readonly cardId: string;
  readonly clientId: string;
  readonly occurredAt: Date;
  readonly amount: number;
  readonly currency: string;
  readonly merchantId: string;
  readonly mcc: string;
  readonly city: string;
  readonly location: GeoPoint;
  readonly channel: TransactionChannel;
  readonly response: TransactionResponse;

  private constructor(props: TransactionProps) {
    this.id = props.id;
    this.cardId = props.cardId;
    this.clientId = props.clientId;
    this.occurredAt = new Date(props.occurredAt);
    this.amount = props.amount;
    this.currency = props.currency;
    this.merchantId = props.merchantId;
    this.mcc = props.mcc;
    this.city = props.city;
    this.location = props.location;
    this.channel = props.channel;
    this.response = props.response;
  }

  static create(props: TransactionProps): Transaction {
    if (!props.id || !props.cardId || !props.clientId || !props.merchantId) {
      throw new Error('Transaction identifiers must not be empty');
    }
    if (!Number.isSafeInteger(props.amount) || props.amount <= 0) {
      throw new RangeError('Transaction amount must be a positive safe integer');
    }
    if (Number.isNaN(props.occurredAt.getTime())) {
      throw new TypeError('Transaction timestamp is invalid');
    }
    return new Transaction(props);
  }

  isPhysical(): boolean {
    return this.channel === 'ATM' || this.channel === 'POS';
  }
}
