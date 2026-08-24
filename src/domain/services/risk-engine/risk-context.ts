import { Transaction } from '../../entities';

export type ClientSegment = 'STANDARD' | 'YOUNG' | 'PREMIUM';
export type MerchantRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ClientRiskProfile {
  monthlyIncome: number;
  openedAt: Date;
  segment: ClientSegment;
  homeCity: string;
}

export interface CardRiskProfile {
  dailyLimit: number;
  openedAt: Date;
  type: 'UZCARD' | 'HUMO' | 'VISA' | 'MASTERCARD';
}

export interface MerchantRiskProfile {
  category: string;
  city: string;
  riskLevel: MerchantRiskLevel;
}

export interface ClientBaseline {
  sampleCount: number;
  amountMean: number;
  amountStandardDeviation: number;
  amountMedian: number | null;
  amountQ1: number | null;
  amountQ3: number | null;
  frequentCities: Readonly<Record<string, number>>;
  frequentMccs: Readonly<Record<string, number>>;
}

export interface RiskContext {
  client: ClientRiskProfile;
  card: CardRiskProfile;
  merchant: MerchantRiskProfile;
  baseline: ClientBaseline;
  recentCardTransactions: readonly Transaction[];
  lastPhysicalTransaction: Transaction | null;
}
