import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lt, or, SQL } from 'drizzle-orm';
import {
  AlertDetail,
  AlertFilters,
  AlertListItem,
  AlertQueryRepository,
} from '../../application/ports/alert-query.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import {
  alerts,
  clients,
  decisions,
  investigationCases,
  merchants,
  securityChallengeResponses,
  securityChallenges,
  transactions,
} from '../../database/schemas';

@Injectable()
export class DrizzleAlertQueryRepository implements AlertQueryRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async list(filters: AlertFilters): Promise<readonly AlertListItem[]> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(alerts.status, filters.status));
    if (filters.clientId) conditions.push(eq(alerts.clientId, filters.clientId));
    if (filters.minimumRiskScore !== undefined) {
      conditions.push(gte(alerts.riskScore, filters.minimumRiskScore));
    }
    if (filters.cursor) {
      conditions.push(
        or(
          lt(alerts.createdAt, filters.cursor.createdAt),
          and(eq(alerts.createdAt, filters.cursor.createdAt), lt(alerts.id, filters.cursor.id)),
        )!,
      );
    }

    const rows = await this.database
      .select({
        alert: alerts,
        decision: decisions,
        transaction: transactions,
        clientName: clients.fullName,
        merchantName: merchants.name,
      })
      .from(alerts)
      .innerJoin(decisions, eq(decisions.id, alerts.decisionId))
      .innerJoin(transactions, eq(transactions.id, alerts.transactionId))
      .innerJoin(clients, eq(clients.id, alerts.clientId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alerts.createdAt), desc(alerts.id))
      .limit(filters.limit);

    return rows.map((row) => ({
      id: row.alert.id,
      transactionId: row.alert.transactionId,
      clientId: row.alert.clientId,
      clientName: row.clientName,
      amount: row.transaction.amount,
      currency: row.transaction.currency,
      merchantName: row.merchantName,
      city: row.transaction.city,
      riskScore: row.alert.riskScore,
      status: row.alert.status,
      action: row.decision.action,
      signalCodes: row.decision.signals.map((signal) => signal.code),
      occurredAt: row.transaction.occurredAt,
      createdAt: row.alert.createdAt,
    }));
  }

  async findById(id: string): Promise<AlertDetail | null> {
    const [row] = await this.database
      .select({
        alert: alerts,
        decision: decisions,
        transaction: transactions,
        clientName: clients.fullName,
        merchantName: merchants.name,
        caseId: investigationCases.id,
        caseStatus: investigationCases.status,
        challengeId: securityChallenges.id,
        challengeStatus: securityChallenges.status,
        challengeExpiresAt: securityChallenges.expiresAt,
        challengeRespondedAt: securityChallenges.respondedAt,
        customerDecision: securityChallengeResponses.decision,
        challengeResolution: securityChallengeResponses.resolution,
        locationMatch: securityChallengeResponses.locationMatch,
        timezoneMatch: securityChallengeResponses.timezoneMatch,
        clockMatch: securityChallengeResponses.clockMatch,
        clockSkewSeconds: securityChallengeResponses.clockSkewSeconds,
        distanceKm: securityChallengeResponses.distanceKm,
      })
      .from(alerts)
      .innerJoin(decisions, eq(decisions.id, alerts.decisionId))
      .innerJoin(transactions, eq(transactions.id, alerts.transactionId))
      .innerJoin(clients, eq(clients.id, alerts.clientId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .leftJoin(investigationCases, eq(investigationCases.alertId, alerts.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .leftJoin(
        securityChallengeResponses,
        eq(securityChallengeResponses.challengeId, securityChallenges.id),
      )
      .where(eq(alerts.id, id))
      .limit(1);

    return row
      ? {
          id: row.alert.id,
          transactionId: row.alert.transactionId,
          clientId: row.alert.clientId,
          clientName: row.clientName,
          amount: row.transaction.amount,
          currency: row.transaction.currency,
          merchantName: row.merchantName,
          city: row.transaction.city,
          riskScore: row.alert.riskScore,
          status: row.alert.status,
          action: row.decision.action,
          signalCodes: row.decision.signals.map((signal) => signal.code),
          occurredAt: row.transaction.occurredAt,
          createdAt: row.alert.createdAt,
          cardId: row.transaction.cardId,
          channel: row.transaction.channel,
          response: row.transaction.response,
          mcc: row.transaction.mcc,
          latitude: row.transaction.latitude,
          longitude: row.transaction.longitude,
          ruleVersion: row.decision.ruleVersion,
          signals: row.decision.signals,
          caseId: row.caseId,
          caseStatus: row.caseStatus,
          customerVerification:
            row.challengeId && row.challengeStatus && row.challengeExpiresAt
              ? {
                  challengeId: row.challengeId,
                  status: row.challengeStatus,
                  expiresAt: row.challengeExpiresAt,
                  respondedAt: row.challengeRespondedAt,
                  customerDecision: row.customerDecision,
                  resolution: row.challengeResolution,
                  checks:
                    row.locationMatch !== null &&
                    row.timezoneMatch !== null &&
                    row.clockMatch !== null &&
                    row.clockSkewSeconds !== null &&
                    row.distanceKm !== null
                      ? {
                          locationMatch: row.locationMatch,
                          timezoneMatch: row.timezoneMatch,
                          clockMatch: row.clockMatch,
                          clockSkewSeconds: row.clockSkewSeconds,
                          distanceKm: row.distanceKm,
                        }
                      : null,
                }
              : null,
        }
      : null;
  }
}
