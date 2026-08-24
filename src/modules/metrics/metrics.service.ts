import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardMetrics,
  METRICS_REPOSITORY,
  MetricsRepository,
} from '../../application/ports/metrics.repository';
import { RISK_ENGINE } from '../../application/replay-transactions/replay-transactions.use-case';
import { RiskEngine } from '../../domain/services/risk-engine';

@Injectable()
export class MetricsService {
  constructor(
    @Inject(METRICS_REPOSITORY) private readonly metrics: MetricsRepository,
    @Inject(RISK_ENGINE) private readonly riskEngine: RiskEngine,
  ) {}

  getDashboard(): Promise<DashboardMetrics> {
    return this.metrics.getDashboardMetrics(this.riskEngine.ruleVersion);
  }
}
