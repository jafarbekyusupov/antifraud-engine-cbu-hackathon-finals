export interface DashboardMetrics {
  generatedAt: Date;
  ruleVersion: string;
  transactions: {
    total: number;
    scored: number;
    unscored: number;
  };
  actions: {
    approve: number;
    stepUp: number;
    block: number;
  };
  riskScore: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  processingTimeMs: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  alerts: Record<'total' | 'open' | 'confirmed' | 'falsePositive' | 'closed', number>;
  cases: Record<
    'total' | 'open' | 'investigating' | 'confirmed' | 'falsePositive' | 'closed',
    number
  >;
  challenges: Record<
    'total' | 'pending' | 'verified' | 'denied' | 'reviewRequired' | 'expired',
    number
  >;
}

export interface MetricsRepository {
  getDashboardMetrics(ruleVersion: string): Promise<DashboardMetrics>;
}

export const METRICS_REPOSITORY = Symbol('METRICS_REPOSITORY');
