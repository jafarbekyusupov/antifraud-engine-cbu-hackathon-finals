import { Module } from '@nestjs/common';
import { METRICS_REPOSITORY } from '../../application/ports/metrics.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleMetricsRepository } from '../../infrastructure/persistence/drizzle-metrics.repository';
import { RiskModule } from '../risk/risk.module';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [DatabaseModule, RiskModule],
  controllers: [MetricsController],
  providers: [
    {
      provide: METRICS_REPOSITORY,
      useClass: DrizzleMetricsRepository,
    },
    MetricsService,
  ],
})
export class MetricsModule {}
