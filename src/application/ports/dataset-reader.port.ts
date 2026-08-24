import { Transaction } from '../../domain/entities';
import { ClientSegment, MerchantRiskLevel } from '../../domain/services/risk-engine';

export interface ClientImportRecord {
  id: string;
  fullName: string;
  gender: 'M' | 'F';
  birthYear: number;
  region: string;
  homeCity: string;
  openedAt: Date;
  monthlyIncome: number;
  segment: ClientSegment;
}

export interface CardImportRecord {
  id: string;
  clientId: string;
  type: 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD';
  currency: string;
  openedAt: Date;
  dailyLimit: number;
}

export interface MerchantImportRecord {
  id: string;
  name: string;
  mcc: string;
  category: string;
  city: string;
  riskLevel: MerchantRiskLevel;
}

export interface DatasetReader {
  clients(): AsyncIterable<ClientImportRecord>;
  cards(): AsyncIterable<CardImportRecord>;
  merchants(): AsyncIterable<MerchantImportRecord>;
  transactions(): AsyncIterable<Transaction>;
}

export const DATASET_READER = Symbol('DATASET_READER');
