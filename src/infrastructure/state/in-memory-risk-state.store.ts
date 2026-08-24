import { Injectable } from '@nestjs/common';
import { RiskStateStore } from '../../application/ports/risk-state-store.port';
import { ReplayTransaction } from '../../application/ports/transaction-replay.repository';
import { Transaction } from '../../domain/entities';
import { ClientBaseline, RiskContext } from '../../domain/services/risk-engine';

const RECENT_CARD_WINDOW_MS = 15 * 60 * 1_000;
const AMOUNT_SAMPLE_LIMIT = 256;

interface ClientState {
  count: number;
  mean: number;
  m2: number;
  amountQueue: number[];
  sortedAmounts: number[];
  cityCounts: Map<string, number>;
  mccCounts: Map<string, number>;
  lastPhysicalTransaction: Transaction | null;
}

@Injectable()
export class InMemoryRiskStateStore implements RiskStateStore {
  private readonly cardTransactions = new Map<string, Transaction[]>();
  private readonly clients = new Map<string, ClientState>();

  contextFor(item: ReplayTransaction): RiskContext {
    const state = this.clientState(item.transaction.clientId);
    return {
      client: item.client,
      card: item.card,
      merchant: item.merchant,
      baseline: this.baseline(state),
      recentCardTransactions: [...(this.cardTransactions.get(item.transaction.cardId) ?? [])],
      lastPhysicalTransaction: state.lastPhysicalTransaction,
    };
  }

  record(transaction: Transaction): void {
    this.recordCardTransaction(transaction);
    this.recordClientTransaction(transaction);
  }

  reset(): void {
    this.cardTransactions.clear();
    this.clients.clear();
  }

  private recordCardTransaction(transaction: Transaction): void {
    const windowStart = transaction.occurredAt.getTime() - RECENT_CARD_WINDOW_MS;
    const recent = this.cardTransactions.get(transaction.cardId) ?? [];
    let firstIncluded = 0;
    while (
      firstIncluded < recent.length &&
      (recent[firstIncluded]?.occurredAt.getTime() ?? Number.POSITIVE_INFINITY) < windowStart
    ) {
      firstIncluded += 1;
    }
    const pruned = firstIncluded === 0 ? recent : recent.slice(firstIncluded);
    pruned.push(transaction);
    this.cardTransactions.set(transaction.cardId, pruned);
  }

  private recordClientTransaction(transaction: Transaction): void {
    const state = this.clientState(transaction.clientId);
    state.count += 1;
    const delta = transaction.amount - state.mean;
    state.mean += delta / state.count;
    state.m2 += delta * (transaction.amount - state.mean);

    state.amountQueue.push(transaction.amount);
    this.insertSorted(state.sortedAmounts, transaction.amount);
    if (state.amountQueue.length > AMOUNT_SAMPLE_LIMIT) {
      const removed = state.amountQueue.shift();
      if (removed !== undefined) this.removeSorted(state.sortedAmounts, removed);
    }

    state.cityCounts.set(transaction.city, (state.cityCounts.get(transaction.city) ?? 0) + 1);
    state.mccCounts.set(transaction.mcc, (state.mccCounts.get(transaction.mcc) ?? 0) + 1);
    if (transaction.isPhysical()) state.lastPhysicalTransaction = transaction;
  }

  private clientState(clientId: string): ClientState {
    let state = this.clients.get(clientId);
    if (!state) {
      state = {
        count: 0,
        mean: 0,
        m2: 0,
        amountQueue: [],
        sortedAmounts: [],
        cityCounts: new Map(),
        mccCounts: new Map(),
        lastPhysicalTransaction: null,
      };
      this.clients.set(clientId, state);
    }
    return state;
  }

  private baseline(state: ClientState): ClientBaseline {
    return {
      sampleCount: state.count,
      amountMean: state.mean,
      amountStandardDeviation: state.count > 1 ? Math.sqrt(state.m2 / (state.count - 1)) : 0,
      amountMedian: this.quantile(state.sortedAmounts, 0.5),
      amountQ1: this.quantile(state.sortedAmounts, 0.25),
      amountQ3: this.quantile(state.sortedAmounts, 0.75),
      frequentCities: Object.fromEntries(state.cityCounts),
      frequentMccs: Object.fromEntries(state.mccCounts),
    };
  }

  private quantile(sorted: readonly number[], fraction: number): number | null {
    if (sorted.length === 0) return null;
    const index = (sorted.length - 1) * fraction;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const lowerValue = sorted[lower];
    const upperValue = sorted[upper];
    if (lowerValue === undefined || upperValue === undefined) return null;
    return lowerValue + (upperValue - lowerValue) * (index - lower);
  }

  private insertSorted(values: number[], value: number): void {
    let low = 0;
    let high = values.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if ((values[middle] ?? Number.POSITIVE_INFINITY) <= value) low = middle + 1;
      else high = middle;
    }
    values.splice(low, 0, value);
  }

  private removeSorted(values: number[], value: number): void {
    const index = values.indexOf(value);
    if (index >= 0) values.splice(index, 1);
  }
}
