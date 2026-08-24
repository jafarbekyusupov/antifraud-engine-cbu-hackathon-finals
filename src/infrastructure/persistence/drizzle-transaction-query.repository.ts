import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lt, lte, or, SQL } from 'drizzle-orm';
import {
  CustomerTransactionDetail,
  CustomerTransactionListItem,
  TransactionDetail,
  TransactionFilters,
  TransactionListItem,
  TransactionQueryRepository,
} from '../../application/ports/transaction-query.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import {
  alerts,
  caseEvents,
  clients,
  decisions,
  investigationCases,
  merchants,
  securityChallengeResponses,
  securityChallenges,
  transactions,
} from '../../database/schemas';

@Injectable()
export class DrizzleTransactionQueryRepository implements TransactionQueryRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async listOperator(filters: TransactionFilters): Promise<readonly TransactionListItem[]> {
    const rows = await this.database
      .select({
        transaction: transactions,
        clientName: clients.fullName,
        merchantName: merchants.name,
        decision: decisions,
        alert: alerts,
        challenge: securityChallenges,
      })
      .from(transactions)
      .innerJoin(clients, eq(clients.id, transactions.clientId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .leftJoin(decisions, eq(decisions.transactionId, transactions.id))
      .leftJoin(alerts, eq(alerts.decisionId, decisions.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .where(this.where(filters))
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(filters.limit);

    return rows.map((row) => this.toOperatorListItem(row));
  }

  async findOperator(id: string): Promise<TransactionDetail | null> {
    const [row] = await this.database
      .select({
        transaction: transactions,
        clientName: clients.fullName,
        merchantName: merchants.name,
        merchantCategory: merchants.category,
        merchantCity: merchants.city,
        merchantRiskLevel: merchants.riskLevel,
        decision: decisions,
        alert: alerts,
        challenge: securityChallenges,
        challengeResponse: securityChallengeResponses,
        case: investigationCases,
      })
      .from(transactions)
      .innerJoin(clients, eq(clients.id, transactions.clientId))
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .leftJoin(decisions, eq(decisions.transactionId, transactions.id))
      .leftJoin(alerts, eq(alerts.decisionId, decisions.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .leftJoin(
        securityChallengeResponses,
        eq(securityChallengeResponses.challengeId, securityChallenges.id),
      )
      .leftJoin(investigationCases, eq(investigationCases.alertId, alerts.id))
      .where(eq(transactions.id, id))
      .limit(1);
    if (!row) return null;

    return this.toOperatorDetail(row);
  }

  async listCustomer(
    clientId: string,
    filters: TransactionFilters,
  ): Promise<readonly CustomerTransactionListItem[]> {
    const rows = await this.database
      .select({
        transaction: transactions,
        merchantName: merchants.name,
        challenge: securityChallenges,
      })
      .from(transactions)
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .leftJoin(decisions, eq(decisions.transactionId, transactions.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .where(and(eq(transactions.clientId, clientId), ...this.whereParts(filters)))
      .orderBy(desc(transactions.occurredAt), desc(transactions.id))
      .limit(filters.limit);

    return rows.map((row) => ({
      transactionId: row.transaction.id,
      merchantName: row.merchantName,
      amount: row.transaction.amount,
      currency: row.transaction.currency,
      occurredAt: row.transaction.occurredAt,
      city: row.transaction.city,
      channel: row.transaction.channel,
      response: row.transaction.response,
      verificationStatus: row.challenge?.status ?? null,
    }));
  }

  async findCustomer(id: string, clientId: string): Promise<CustomerTransactionDetail | null> {
    const [row] = await this.database
      .select({
        transaction: transactions,
        merchantName: merchants.name,
        merchantCategory: merchants.category,
        merchantCity: merchants.city,
        challenge: securityChallenges,
        challengeResponse: securityChallengeResponses,
      })
      .from(transactions)
      .innerJoin(merchants, eq(merchants.id, transactions.merchantId))
      .leftJoin(decisions, eq(decisions.transactionId, transactions.id))
      .leftJoin(securityChallenges, eq(securityChallenges.decisionId, decisions.id))
      .leftJoin(
        securityChallengeResponses,
        eq(securityChallengeResponses.challengeId, securityChallenges.id),
      )
      .where(and(eq(transactions.id, id), eq(transactions.clientId, clientId)))
      .limit(1);
    if (!row) return null;

    return {
      transactionId: row.transaction.id,
      merchantName: row.merchantName,
      amount: row.transaction.amount,
      currency: row.transaction.currency,
      occurredAt: row.transaction.occurredAt,
      city: row.transaction.city,
      channel: row.transaction.channel,
      response: row.transaction.response,
      verificationStatus: row.challenge?.status ?? null,
      cardId: row.transaction.cardId,
      merchantCategory: row.merchantCategory,
      merchantCity: row.merchantCity,
      mcc: row.transaction.mcc,
      latitude: row.transaction.latitude,
      longitude: row.transaction.longitude,
      verification: row.challenge
        ? {
            status: row.challenge.status,
            expiresAt: row.challenge.expiresAt,
            respondedAt: row.challenge.respondedAt,
            resolution: row.challengeResponse?.resolution ?? null,
          }
        : null,
    };
  }

  private where(filters: TransactionFilters): SQL | undefined {
    const parts = this.whereParts(filters);
    return parts.length > 0 ? and(...parts) : undefined;
  }

  private whereParts(filters: TransactionFilters): SQL[] {
    const parts: SQL[] = [];
    if (filters.clientId) parts.push(eq(transactions.clientId, filters.clientId));
    if (filters.cardId) parts.push(eq(transactions.cardId, filters.cardId));
    if (filters.merchantId) parts.push(eq(transactions.merchantId, filters.merchantId));
    if (filters.channel) parts.push(eq(transactions.channel, filters.channel));
    if (filters.response) parts.push(eq(transactions.response, filters.response));
    if (filters.action) parts.push(eq(decisions.action, filters.action));
    if (filters.from) parts.push(gte(transactions.occurredAt, filters.from));
    if (filters.to) parts.push(lte(transactions.occurredAt, filters.to));
    if (filters.minimumAmount !== undefined) {
      parts.push(gte(transactions.amount, filters.minimumAmount));
    }
    if (filters.maximumAmount !== undefined) {
      parts.push(lte(transactions.amount, filters.maximumAmount));
    }
    if (filters.minimumRiskScore !== undefined) {
      parts.push(gte(decisions.riskScore, filters.minimumRiskScore));
    }
    if (filters.cursor) {
      parts.push(
        or(
          lt(transactions.occurredAt, filters.cursor.occurredAt),
          and(
            eq(transactions.occurredAt, filters.cursor.occurredAt),
            lt(transactions.id, filters.cursor.id),
          ),
        )!,
      );
    }
    return parts;
  }

  private toOperatorListItem(row: {
    transaction: typeof transactions.$inferSelect;
    clientName: string;
    merchantName: string;
    decision: typeof decisions.$inferSelect | null;
    alert: typeof alerts.$inferSelect | null;
    challenge: typeof securityChallenges.$inferSelect | null;
  }): TransactionListItem {
    return {
      transactionId: row.transaction.id,
      cardId: row.transaction.cardId,
      clientId: row.transaction.clientId,
      clientName: row.clientName,
      merchantId: row.transaction.merchantId,
      merchantName: row.merchantName,
      amount: row.transaction.amount,
      currency: row.transaction.currency,
      occurredAt: row.transaction.occurredAt,
      city: row.transaction.city,
      channel: row.transaction.channel,
      response: row.transaction.response,
      mcc: row.transaction.mcc,
      riskScore: row.decision?.riskScore ?? null,
      action: row.decision?.action ?? null,
      signalCodes: row.decision?.signals.map((signal) => signal.code) ?? [],
      alertId: row.alert?.id ?? null,
      alertStatus: row.alert?.status ?? null,
      customerVerificationStatus: row.challenge?.status ?? null,
    };
  }

  private toOperatorDetail(row: {
    transaction: typeof transactions.$inferSelect;
    clientName: string;
    merchantName: string;
    merchantCategory: string;
    merchantCity: string;
    merchantRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    decision: typeof decisions.$inferSelect | null;
    alert: typeof alerts.$inferSelect | null;
    challenge: typeof securityChallenges.$inferSelect | null;
    challengeResponse: typeof securityChallengeResponses.$inferSelect | null;
    case: typeof investigationCases.$inferSelect | null;
  }): TransactionDetail {
    const list = this.toOperatorListItem(row);
    return {
      ...list,
      latitude: row.transaction.latitude,
      longitude: row.transaction.longitude,
      merchantCategory: row.merchantCategory,
      merchantCity: row.merchantCity,
      merchantRiskLevel: row.merchantRiskLevel,
      ruleVersion: row.decision?.ruleVersion ?? null,
      signals: row.decision?.signals ?? [],
      caseId: row.case?.id ?? null,
      caseStatus: row.case?.status ?? null,
      customerVerification: row.challenge
        ? {
            challengeId: row.challenge.id,
            status: row.challenge.status,
            expiresAt: row.challenge.expiresAt,
            respondedAt: row.challenge.respondedAt,
            customerDecision: row.challengeResponse?.decision ?? null,
            resolution: row.challengeResponse?.resolution ?? null,
            checks: row.challengeResponse
              ? {
                  locationMatch: row.challengeResponse.locationMatch,
                  timezoneMatch: row.challengeResponse.timezoneMatch,
                  clockMatch: row.challengeResponse.clockMatch,
                  clockSkewSeconds: row.challengeResponse.clockSkewSeconds,
                  distanceKm: row.challengeResponse.distanceKm,
                }
              : null,
          }
        : null,
    };
  }
}
