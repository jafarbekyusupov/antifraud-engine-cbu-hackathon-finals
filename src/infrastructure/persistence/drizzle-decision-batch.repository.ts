import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { securityChallengeExpiresAt } from '../../application/common/security-challenge-expiry';
import {
  DecisionBatchRepository,
  ScoredTransaction,
} from '../../application/ports/decision-batch.repository';
import { AppConfig } from '../../config/app.config';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { alerts, decisions, securityChallenges } from '../../database/schemas';

@Injectable()
export class DrizzleDecisionBatchRepository implements DecisionBatchRepository {
  constructor(
    @Inject(DATABASE) private readonly database: AntiFraudDatabase,
    private readonly config: AppConfig,
  ) {}

  async save(
    records: readonly ScoredTransaction[],
  ): Promise<{ decisions: number; alerts: number }> {
    if (records.length === 0) return { decisions: 0, alerts: 0 };

    return this.database.transaction(async (transaction) => {
      const insertedDecisions = await transaction
        .insert(decisions)
        .values(
          records.map((record) => ({
            id: record.decisionId,
            transactionId: record.transaction.id,
            riskScore: record.assessment.riskScore,
            action: record.assessment.action,
            signals: record.assessment.signals.map((signal) => ({
              code: signal.code,
              score: signal.score.value,
              message: signal.message,
              evidence: { ...signal.evidence },
            })),
            ruleVersion: record.assessment.ruleVersion,
            processingTimeUs: record.processingTimeUs,
          })),
        )
        .onConflictDoNothing()
        .returning({ id: decisions.id });

      const insertedIds = new Set(insertedDecisions.map((decision) => decision.id));
      const newAlerts = records
        .filter(
          (record) => record.assessment.action === 'BLOCK' && insertedIds.has(record.decisionId),
        )
        .map((record) => ({
          decisionId: record.decisionId,
          transactionId: record.transaction.id,
          clientId: record.transaction.clientId,
          riskScore: record.assessment.riskScore,
        }));

      if (newAlerts.length > 0) {
        await transaction.insert(alerts).values(newAlerts).onConflictDoNothing();
      }

      if (this.config.createReplayChallenges) {
        const stepUpRecords = records.filter((record) => record.assessment.action === 'STEP_UP');
        const ruleVersion = stepUpRecords[0]?.assessment.ruleVersion;
        if (stepUpRecords.length > 0 && ruleVersion) {
          const decisionRows = await transaction
            .select({ id: decisions.id, transactionId: decisions.transactionId })
            .from(decisions)
            .where(
              and(
                eq(decisions.ruleVersion, ruleVersion),
                inArray(
                  decisions.transactionId,
                  stepUpRecords.map((record) => record.transaction.id),
                ),
              ),
            );
          const decisionIdByTransaction = new Map(
            decisionRows.map((decision) => [decision.transactionId, decision.id]),
          );
          const expiresAt = securityChallengeExpiresAt(
            this.config.securityChallengeTtlSeconds,
          );
          const challengeRows = stepUpRecords.flatMap((record) => {
            const decisionId = decisionIdByTransaction.get(record.transaction.id);
            return decisionId
              ? [
                  {
                    decisionId,
                    transactionId: record.transaction.id,
                    clientId: record.transaction.clientId,
                    expiresAt,
                  },
                ]
              : [];
          });
          if (challengeRows.length > 0) {
            await transaction
              .insert(securityChallenges)
              .values(challengeRows)
              .onConflictDoNothing({ target: securityChallenges.decisionId });
          }
        }
      }

      return { decisions: insertedDecisions.length, alerts: newAlerts.length };
    });
  }
}
