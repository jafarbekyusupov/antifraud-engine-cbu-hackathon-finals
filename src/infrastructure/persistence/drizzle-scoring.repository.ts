import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { securityChallengeExpiresAt } from '../../application/common/security-challenge-expiry';
import {
  SaveScoreInput,
  ScoreTransactionResult,
  ScoringRepository,
} from '../../application/ports/scoring.repository';
import { ReplayTransaction } from '../../application/ports/transaction-replay.repository';
import { AppConfig } from '../../config/app.config';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import {
  alerts,
  cards,
  clients,
  decisions,
  merchants,
  securityChallenges,
  transactions,
} from '../../database/schemas';

@Injectable()
export class DrizzleScoringRepository implements ScoringRepository {
  constructor(
    @Inject(DATABASE) private readonly database: AntiFraudDatabase,
    private readonly config: AppConfig,
  ) {}

  async findDecision(
    transactionId: string,
    ruleVersion: string,
  ): Promise<ScoreTransactionResult | null> {
    const [record] = await this.database
      .select({
        decisionId: decisions.id,
        transactionId: decisions.transactionId,
        riskScore: decisions.riskScore,
        action: decisions.action,
        signals: decisions.signals,
        ruleVersion: decisions.ruleVersion,
        processingTimeUs: decisions.processingTimeUs,
        alertId: alerts.id,
        challengeId: securityChallenges.id,
      })
      .from(decisions)
      .leftJoin(alerts, eq(alerts.decisionId, decisions.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .where(
        and(eq(decisions.transactionId, transactionId), eq(decisions.ruleVersion, ruleVersion)),
      )
      .limit(1);

    return record
      ? {
          transactionId: record.transactionId,
          decisionId: record.decisionId,
          alertId: record.alertId,
          challengeId: record.challengeId,
          riskScore: record.riskScore,
          action: record.action,
          signals: record.signals,
          ruleVersion: record.ruleVersion,
          processingTimeMs: record.processingTimeUs / 1_000,
        }
      : null;
  }

  async loadReferenceData(
    transaction: SaveScoreInput['transaction'],
  ): Promise<ReplayTransaction | null> {
    const [record] = await this.database
      .select({ client: clients, card: cards, merchant: merchants })
      .from(cards)
      .innerJoin(clients, eq(clients.id, cards.clientId))
      .innerJoin(merchants, eq(merchants.id, transaction.merchantId))
      .where(
        and(
          eq(cards.id, transaction.cardId),
          eq(cards.clientId, transaction.clientId),
          eq(clients.id, transaction.clientId),
        ),
      )
      .limit(1);

    return record
      ? {
          transaction,
          client: {
            monthlyIncome: record.client.monthlyIncome,
            openedAt: record.client.openedAt,
            segment: record.client.segment,
            homeCity: record.client.homeCity,
          },
          card: {
            dailyLimit: record.card.dailyLimit,
            openedAt: record.card.openedAt,
            type: record.card.type,
          },
          merchant: {
            category: record.merchant.category,
            city: record.merchant.city,
            riskLevel: record.merchant.riskLevel,
          },
        }
      : null;
  }

  async save(input: SaveScoreInput): Promise<ScoreTransactionResult> {
    return this.database.transaction(async (database) => {
      await database
        .insert(transactions)
        .values({
          id: input.transaction.id,
          cardId: input.transaction.cardId,
          clientId: input.transaction.clientId,
          occurredAt: input.transaction.occurredAt,
          amount: input.transaction.amount,
          currency: input.transaction.currency,
          merchantId: input.transaction.merchantId,
          mcc: input.transaction.mcc,
          city: input.transaction.city,
          latitude: input.transaction.location.latitude,
          longitude: input.transaction.location.longitude,
          channel: input.transaction.channel,
          response: input.transaction.response,
        })
        .onConflictDoNothing({ target: transactions.id });

      const [decision] = await database
        .insert(decisions)
        .values({
          id: input.decisionId,
          transactionId: input.transaction.id,
          riskScore: input.assessment.riskScore,
          action: input.assessment.action,
          signals: input.assessment.signals.map((signal) => ({
            code: signal.code,
            score: signal.score.value,
            message: signal.message,
            evidence: { ...signal.evidence },
          })),
          ruleVersion: input.assessment.ruleVersion,
          processingTimeUs: input.processingTimeUs,
        })
        .returning({ id: decisions.id });
      if (!decision) throw new Error('Decision insert did not return a row');

      let alertId: string | null = null;
      let challengeId: string | null = null;
      if (input.assessment.action === 'BLOCK') {
        const [alert] = await database
          .insert(alerts)
          .values({
            decisionId: decision.id,
            transactionId: input.transaction.id,
            clientId: input.transaction.clientId,
            riskScore: input.assessment.riskScore,
          })
          .returning({ id: alerts.id });
        alertId = alert?.id ?? null;
      }
      if (input.assessment.action === 'STEP_UP') {
        const [challenge] = await database
          .insert(securityChallenges)
          .values({
            decisionId: decision.id,
            transactionId: input.transaction.id,
            clientId: input.transaction.clientId,
            expiresAt: securityChallengeExpiresAt(this.config.securityChallengeTtlSeconds),
          })
          .returning({ id: securityChallenges.id });
        challengeId = challenge?.id ?? null;
      }

      return {
        transactionId: input.transaction.id,
        decisionId: decision.id,
        alertId,
        challengeId,
        riskScore: input.assessment.riskScore,
        action: input.assessment.action,
        signals: input.assessment.signals.map((signal) => ({
          code: signal.code,
          score: signal.score.value,
          message: signal.message,
          evidence: { ...signal.evidence },
        })),
        ruleVersion: input.assessment.ruleVersion,
        processingTimeMs: input.processingTimeUs / 1_000,
      };
    });
  }
}
