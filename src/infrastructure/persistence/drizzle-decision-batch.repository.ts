import { Inject, Injectable } from '@nestjs/common';
import {
  DecisionBatchRepository,
  ScoredTransaction,
} from '../../application/ports/decision-batch.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { alerts, decisions } from '../../database/schemas';

@Injectable()
export class DrizzleDecisionBatchRepository implements DecisionBatchRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

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

      return { decisions: insertedDecisions.length, alerts: newAlerts.length };
    });
  }
}
