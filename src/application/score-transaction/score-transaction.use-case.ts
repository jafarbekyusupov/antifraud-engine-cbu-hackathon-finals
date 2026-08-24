import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/entities';
import { RiskEngine } from '../../domain/services/risk-engine';
import { RISK_STATE_STORE, RiskStateStore } from '../ports/risk-state-store.port';
import {
  SCORING_REPOSITORY,
  ScoreTransactionResult,
  ScoringRepository,
} from '../ports/scoring.repository';
import { RISK_ENGINE } from '../replay-transactions/replay-transactions.use-case';

export class ScoringReferenceNotFoundError extends Error {
  constructor(transaction: Transaction) {
    super(
      `Reference data was not found or inconsistent for card ${transaction.cardId}, client ${transaction.clientId}, or merchant ${transaction.merchantId}`,
    );
    this.name = ScoringReferenceNotFoundError.name;
  }
}

@Injectable()
export class ScoreTransactionUseCase {
  constructor(
    @Inject(SCORING_REPOSITORY) private readonly repository: ScoringRepository,
    @Inject(RISK_STATE_STORE) private readonly state: RiskStateStore,
    @Inject(RISK_ENGINE) private readonly engine: RiskEngine,
  ) {}

  async execute(transaction: Transaction): Promise<ScoreTransactionResult> {
    const existing = await this.repository.findDecision(transaction.id, this.engine.ruleVersion);
    if (existing) return existing;

    const referenceData = await this.repository.loadReferenceData(transaction);
    if (!referenceData) throw new ScoringReferenceNotFoundError(transaction);

    const startedAt = process.hrtime.bigint();
    const assessment = this.engine.assess(transaction, this.state.contextFor(referenceData));
    const processingTimeUs = Number((process.hrtime.bigint() - startedAt) / 1_000n);
    const result = await this.repository.save({
      decisionId: randomUUID(),
      transaction,
      assessment,
      processingTimeUs,
    });
    this.state.record(transaction);
    return result;
  }
}
