import { randomUUID } from 'node:crypto';
import { scheduler } from 'node:timers/promises';
import { Inject, Injectable } from '@nestjs/common';
import { RiskEngine } from '../../domain/services/risk-engine';
import {
  DECISION_BATCH_REPOSITORY,
  DecisionBatchRepository,
  ScoredTransaction,
} from '../ports/decision-batch.repository';
import { RISK_STATE_STORE, RiskStateStore } from '../ports/risk-state-store.port';
import {
  ReplayCursor,
  TRANSACTION_REPLAY_REPOSITORY,
  TransactionReplayRepository,
} from '../ports/transaction-replay.repository';

export const RISK_ENGINE = Symbol('RISK_ENGINE');

export interface ReplayTransactionsResult {
  processed: number;
  decisionsCreated: number;
  alertsCreated: number;
}

export type ReplayProgressCallback = (progress: ReplayTransactionsResult) => Promise<void> | void;

@Injectable()
export class ReplayTransactionsUseCase {
  private readonly pageSize = 500;

  constructor(
    @Inject(TRANSACTION_REPLAY_REPOSITORY)
    private readonly transactions: TransactionReplayRepository,
    @Inject(DECISION_BATCH_REPOSITORY)
    private readonly decisions: DecisionBatchRepository,
    @Inject(RISK_STATE_STORE) private readonly state: RiskStateStore,
    @Inject(RISK_ENGINE) private readonly engine: RiskEngine,
  ) {}

  async execute(onProgress?: ReplayProgressCallback): Promise<ReplayTransactionsResult> {
    this.state.reset();
    let cursor: ReplayCursor | null = null;
    let processed = 0;
    let decisionsCreated = 0;
    let alertsCreated = 0;

    while (true) {
      const page = await this.transactions.readAfter(cursor, this.pageSize);
      if (page.length === 0) break;

      const scored: ScoredTransaction[] = [];
      for (const item of page) {
        const startedAt = process.hrtime.bigint();
        const assessment = this.engine.assess(item.transaction, this.state.contextFor(item));
        const processingTimeUs = Number((process.hrtime.bigint() - startedAt) / 1_000n);
        scored.push({
          decisionId: randomUUID(),
          transaction: item.transaction,
          assessment,
          processingTimeUs,
        });
        this.state.record(item.transaction);
      }

      const saved = await this.decisions.save(scored);
      processed += page.length;
      decisionsCreated += saved.decisions;
      alertsCreated += saved.alerts;

      await onProgress?.({ processed, decisionsCreated, alertsCreated });

      const last = page.at(-1);
      if (!last) break;
      cursor = {
        occurredAt: last.transaction.occurredAt,
        transactionId: last.transaction.id,
      };

      await scheduler.yield();
    }

    return { processed, decisionsCreated, alertsCreated };
  }
}
