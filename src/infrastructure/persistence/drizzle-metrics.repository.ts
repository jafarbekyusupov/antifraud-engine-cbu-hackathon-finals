import { Inject, Injectable } from '@nestjs/common';
import { count, eq, sql } from 'drizzle-orm';
import { DashboardMetrics, MetricsRepository } from '../../application/ports/metrics.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import {
  alerts,
  decisions,
  investigationCases,
  securityChallenges,
  transactions,
} from '../../database/schemas';

interface DistributionRow {
  key: string;
  count: number;
}

interface PercentileRow {
  average: number;
  p50: number;
  p95: number;
  p99: number;
}

@Injectable()
export class DrizzleMetricsRepository implements MetricsRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async getDashboardMetrics(ruleVersion: string): Promise<DashboardMetrics> {
    const [
      transactionCount,
      decisionCount,
      actionRows,
      riskRows,
      latencyRows,
      alertRows,
      caseRows,
      challengeRows,
    ] = await Promise.all([
      this.database.select({ count: count() }).from(transactions),
      this.database
        .select({ count: count() })
        .from(decisions)
        .where(eq(decisions.ruleVersion, ruleVersion)),
      this.database
        .select({ key: decisions.action, count: count() })
        .from(decisions)
        .where(eq(decisions.ruleVersion, ruleVersion))
        .groupBy(decisions.action),
      this.percentiles(decisions.riskScore, ruleVersion, 1),
      this.percentiles(decisions.processingTimeUs, ruleVersion, 1_000),
      this.database
        .select({ key: alerts.status, count: count() })
        .from(alerts)
        .groupBy(alerts.status),
      this.database
        .select({ key: investigationCases.status, count: count() })
        .from(investigationCases)
        .groupBy(investigationCases.status),
      this.database
        .select({ key: securityChallenges.status, count: count() })
        .from(securityChallenges)
        .groupBy(securityChallenges.status),
    ]);

    const totalTransactions = transactionCount[0]?.count ?? 0;
    const scored = decisionCount[0]?.count ?? 0;
    const actions = this.distribution(actionRows);
    const alertDistribution = this.distribution(alertRows);
    const caseDistribution = this.distribution(caseRows);
    const challengeDistribution = this.distribution(challengeRows);

    return {
      generatedAt: new Date(),
      ruleVersion,
      transactions: {
        total: totalTransactions,
        scored,
        unscored: Math.max(0, totalTransactions - scored),
      },
      actions: {
        approve: actions.APPROVE ?? 0,
        stepUp: actions.STEP_UP ?? 0,
        block: actions.BLOCK ?? 0,
      },
      riskScore: riskRows[0] ?? this.emptyPercentiles(),
      processingTimeMs: latencyRows[0] ?? this.emptyPercentiles(),
      alerts: {
        total: this.total(alertDistribution),
        open: alertDistribution.OPEN ?? 0,
        confirmed: alertDistribution.CONFIRMED ?? 0,
        falsePositive: alertDistribution.FALSE_POSITIVE ?? 0,
        closed: alertDistribution.CLOSED ?? 0,
      },
      cases: {
        total: this.total(caseDistribution),
        open: caseDistribution.OPEN ?? 0,
        investigating: caseDistribution.INVESTIGATING ?? 0,
        confirmed: caseDistribution.CONFIRMED ?? 0,
        falsePositive: caseDistribution.FALSE_POSITIVE ?? 0,
        closed: caseDistribution.CLOSED ?? 0,
      },
      challenges: {
        total: this.total(challengeDistribution),
        pending: challengeDistribution.PENDING ?? 0,
        verified: challengeDistribution.VERIFIED ?? 0,
        denied: challengeDistribution.DENIED ?? 0,
        reviewRequired: challengeDistribution.REVIEW_REQUIRED ?? 0,
        expired: challengeDistribution.EXPIRED ?? 0,
      },
    };
  }

  private percentiles(
    column: typeof decisions.riskScore | typeof decisions.processingTimeUs,
    ruleVersion: string,
    divisor: number,
  ): Promise<PercentileRow[]> {
    return this.database
      .select({
        average: sql<number>`coalesce(avg(${column}), 0)::float8 / ${divisor}`,
        p50: sql<number>`coalesce(percentile_cont(0.50) within group (order by ${column}), 0)::float8 / ${divisor}`,
        p95: sql<number>`coalesce(percentile_cont(0.95) within group (order by ${column}), 0)::float8 / ${divisor}`,
        p99: sql<number>`coalesce(percentile_cont(0.99) within group (order by ${column}), 0)::float8 / ${divisor}`,
      })
      .from(decisions)
      .where(eq(decisions.ruleVersion, ruleVersion));
  }

  private distribution(rows: readonly DistributionRow[]): Record<string, number> {
    return Object.fromEntries(rows.map((row) => [row.key, row.count]));
  }

  private total(distribution: Record<string, number>): number {
    return Object.values(distribution).reduce((total, value) => total + value, 0);
  }

  private emptyPercentiles(): PercentileRow {
    return { average: 0, p50: 0, p95: 0, p99: 0 };
  }
}
