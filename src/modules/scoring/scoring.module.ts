import { Module } from '@nestjs/common';
import { SCORING_REPOSITORY } from '../../application/ports/scoring.repository';
import { ScoreTransactionUseCase } from '../../application/score-transaction/score-transaction.use-case';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleScoringRepository } from '../../infrastructure/persistence/drizzle-scoring.repository';
import { RiskModule } from '../risk/risk.module';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [DatabaseModule, RiskModule],
  controllers: [ScoringController],
  providers: [
    {
      provide: SCORING_REPOSITORY,
      useClass: DrizzleScoringRepository,
    },
    ScoreTransactionUseCase,
  ],
})
export class ScoringModule {}
