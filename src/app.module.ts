import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { CasesModule } from './modules/cases/cases.module';
import { CustomerSecurityModule } from './modules/customer-security/customer-security.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CardsModule } from './modules/cards/cards.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    CardsModule,
    MetricsModule,
    EvaluationModule,
    AlertsModule,
    CasesModule,
    CustomerSecurityModule,
    HealthModule,
    IngestionModule,
    ScoringModule,
    TransactionsModule,
  ],
})
export class AppModule {}
