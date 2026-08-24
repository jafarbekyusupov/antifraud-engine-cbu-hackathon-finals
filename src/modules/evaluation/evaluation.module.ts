import { Module } from '@nestjs/common';
import {
  FRAUD_LABEL_READER,
  FRAUD_PREDICTION_REPOSITORY,
} from '../../application/ports/fraud-evaluation.repository';
import { AppConfig } from '../../config/app.config';
import { DatabaseModule } from '../../database/database.module';
import { CsvFraudLabelReader } from '../../infrastructure/evaluation/csv-fraud-label.reader';
import { DrizzleFraudPredictionRepository } from '../../infrastructure/persistence/drizzle-fraud-prediction.repository';
import { RiskModule } from '../risk/risk.module';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { FraudSignalsExportService } from './fraud-signals-export.service';

@Module({
  imports: [DatabaseModule, RiskModule],
  controllers: [EvaluationController],
  providers: [
    {
      provide: FRAUD_PREDICTION_REPOSITORY,
      useClass: DrizzleFraudPredictionRepository,
    },
    {
      provide: FRAUD_LABEL_READER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): CsvFraudLabelReader =>
        new CsvFraudLabelReader(config.dataDirectory),
    },
    EvaluationService,
    FraudSignalsExportService,
  ],
  exports: [FraudSignalsExportService],
})
export class EvaluationModule {}
