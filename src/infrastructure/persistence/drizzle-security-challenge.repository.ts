import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import {
  ChallengeResponseRecord,
  SaveChallengeResponseInput,
  SaveChallengeResponseResult,
  SecurityChallengeDetail,
  SecurityChallengeRepository,
  SecurityChallengeSummary,
} from '../../application/ports/security-challenge.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import {
  alerts,
  decisions,
  merchants,
  securityChallengeResponses,
  securityChallenges,
  transactions,
} from '../../database/schemas';

@Injectable()
export class DrizzleSecurityChallengeRepository implements SecurityChallengeRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async listForClient(clientId: string): Promise<readonly SecurityChallengeSummary[]> {
    const now = new Date();
    await this.database
      .update(securityChallenges)
      .set({ status: 'EXPIRED', updatedAt: now })
      .where(
        and(
          eq(securityChallenges.clientId, clientId),
          eq(securityChallenges.status, 'PENDING'),
          lt(securityChallenges.expiresAt, now),
        ),
      );

    const rows = await this.database
      .select({ challenge: securityChallenges, transaction: transactions, merchant: merchants })
      .from(securityChallenges)
      .innerJoin(transactions, eq(transactions.id, securityChallenges.transactionId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .where(eq(securityChallenges.clientId, clientId))
      .orderBy(desc(securityChallenges.createdAt))
      .limit(50);

    return rows.map((row) => this.toSummary(row.challenge, row.transaction, row.merchant.name));
  }

  async findForClient(id: string, clientId: string): Promise<SecurityChallengeDetail | null> {
    const [row] = await this.database
      .select({ challenge: securityChallenges, transaction: transactions, merchant: merchants })
      .from(securityChallenges)
      .innerJoin(transactions, eq(transactions.id, securityChallenges.transactionId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .where(and(eq(securityChallenges.id, id), eq(securityChallenges.clientId, clientId)))
      .limit(1);

    return row
      ? {
          ...this.toSummary(row.challenge, row.transaction, row.merchant.name),
          transactionId: row.transaction.id,
          transactionLatitude: row.transaction.latitude,
          transactionLongitude: row.transaction.longitude,
        }
      : null;
  }

  async saveResponse(input: SaveChallengeResponseInput): Promise<SaveChallengeResponseResult> {
    return this.database.transaction(async (database) => {
      const [record] = await database
        .select({ challenge: securityChallenges, decision: decisions })
        .from(securityChallenges)
        .innerJoin(decisions, eq(decisions.id, securityChallenges.decisionId))
        .where(
          and(
            eq(securityChallenges.id, input.challengeId),
            eq(securityChallenges.clientId, input.clientId),
          ),
        )
        .for('update')
        .limit(1);
      if (!record) return { kind: 'not-found' };

      if (record.challenge.status !== 'PENDING') {
        if (record.challenge.status === 'EXPIRED') return { kind: 'expired' };
        const [existing] = await database
          .select()
          .from(securityChallengeResponses)
          .where(eq(securityChallengeResponses.challengeId, record.challenge.id))
          .limit(1);
        if (!existing) throw new Error(`Challenge ${record.challenge.id} has no response record`);
        return existing.idempotencyKey === input.idempotencyKey
          ? { kind: 'ok', value: this.toResponse(record.challenge.id, existing) }
          : { kind: 'already-responded', value: this.toResponse(record.challenge.id, existing) };
      }

      const now = new Date();
      if (record.challenge.expiresAt.getTime() <= now.getTime()) {
        await database
          .update(securityChallenges)
          .set({ status: 'EXPIRED', updatedAt: now })
          .where(eq(securityChallenges.id, record.challenge.id));
        return { kind: 'expired' };
      }

      const [response] = await database
        .insert(securityChallengeResponses)
        .values({
          challengeId: record.challenge.id,
          idempotencyKey: input.idempotencyKey,
          decision: input.decision,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracyMeters: input.accuracyMeters,
          timezoneName: input.timezoneName,
          utcOffsetMinutes: input.utcOffsetMinutes,
          deviceTimestamp: input.deviceTimestamp,
          locationMatch: input.checks.locationMatch,
          timezoneMatch: input.checks.timezoneMatch,
          clockMatch: input.checks.clockMatch,
          clockSkewSeconds: input.checks.clockSkewSeconds,
          distanceKm: input.checks.distanceKm,
          resolution: input.resolution,
        })
        .returning();
      if (!response) throw new Error('Security challenge response insert did not return a row');

      await database
        .update(securityChallenges)
        .set({ status: input.status, respondedAt: now, updatedAt: now })
        .where(eq(securityChallenges.id, record.challenge.id));

      if (input.resolution !== 'ALLOW') {
        await database
          .insert(alerts)
          .values({
            decisionId: record.challenge.decisionId,
            transactionId: record.challenge.transactionId,
            clientId: record.challenge.clientId,
            riskScore: record.decision.riskScore,
          })
          .onConflictDoNothing({ target: alerts.decisionId });
      }

      return { kind: 'ok', value: this.toResponse(record.challenge.id, response) };
    });
  }

  private toSummary(
    challenge: typeof securityChallenges.$inferSelect,
    transaction: typeof transactions.$inferSelect,
    merchantName: string,
  ): SecurityChallengeSummary {
    return {
      id: challenge.id,
      status: challenge.status,
      merchantName,
      amount: transaction.amount,
      currency: transaction.currency,
      occurredAt: transaction.occurredAt,
      city: transaction.city,
      channel: transaction.channel,
      expiresAt: challenge.expiresAt,
    };
  }

  private toResponse(
    challengeId: string,
    response: typeof securityChallengeResponses.$inferSelect,
  ): ChallengeResponseRecord {
    const status =
      response.resolution === 'ALLOW'
        ? 'VERIFIED'
        : response.resolution === 'BLOCK'
          ? 'DENIED'
          : 'REVIEW_REQUIRED';
    return {
      challengeId,
      status,
      resolution: response.resolution,
      checks: {
        locationMatch: response.locationMatch,
        timezoneMatch: response.timezoneMatch,
        clockMatch: response.clockMatch,
        clockSkewSeconds: response.clockSkewSeconds,
        distanceKm: response.distanceKm,
      },
      respondedAt: response.createdAt,
    };
  }
}
