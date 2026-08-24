import { Module } from '@nestjs/common';
import { ImportDatasetUseCase } from '../../application/import-dataset/import-dataset.use-case';
import { DECISION_BATCH_REPOSITORY } from '../../application/ports/decision-batch.repository';
import { DATASET_IMPORT_REPOSITORY } from '../../application/ports/dataset-import.repository';
import { DATASET_READER } from '../../application/ports/dataset-reader.port';
import { REPLAY_JOB_REPOSITORY } from '../../application/ports/replay-job.repository';
import { TRANSACTION_REPLAY_REPOSITORY } from '../../application/ports/transaction-replay.repository';
import { ReplayTransactionsUseCase } from '../../application/replay-transactions/replay-transactions.use-case';
import { AppConfig } from '../../config/app.config';
import { DatabaseModule } from '../../database/database.module';
import { CsvDatasetReader } from '../../infrastructure/ingestion/csv-dataset.reader';
import { DrizzleDecisionBatchRepository } from '../../infrastructure/persistence/drizzle-decision-batch.repository';
import { DrizzleDatasetImportRepository } from '../../infrastructure/persistence/drizzle-dataset-import.repository';
import { DrizzleReplayJobRepository } from '../../infrastructure/persistence/drizzle-replay-job.repository';
import { DrizzleTransactionReplayRepository } from '../../infrastructure/persistence/drizzle-transaction-replay.repository';
import { RiskModule } from '../risk/risk.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { ReplayJobController } from './replay-job.controller';
import { ReplayJobService } from './replay-job.service';

@Module({
  imports: [DatabaseModule, RiskModule, EvaluationModule],
  controllers: [ReplayJobController],
  providers: [
    {
      provide: DATASET_READER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): CsvDatasetReader =>
        new CsvDatasetReader(config.dataDirectory),
    },
    {
      provide: DATASET_IMPORT_REPOSITORY,
      useClass: DrizzleDatasetImportRepository,
    },
    {
      provide: TRANSACTION_REPLAY_REPOSITORY,
      useClass: DrizzleTransactionReplayRepository,
    },
    {
      provide: DECISION_BATCH_REPOSITORY,
      useClass: DrizzleDecisionBatchRepository,
    },
    {
      provide: REPLAY_JOB_REPOSITORY,
      useClass: DrizzleReplayJobRepository,
    },
    ImportDatasetUseCase,
    ReplayTransactionsUseCase,
    ReplayJobService,
  ],
  exports: [ImportDatasetUseCase, ReplayTransactionsUseCase],
})
export class IngestionModule {}
