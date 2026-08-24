import { Module } from '@nestjs/common';
import { CASE_REPOSITORY } from '../../application/ports/case.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleCaseRepository } from '../../infrastructure/persistence/drizzle-case.repository';
import { CaseManagementService } from './case-management.service';
import { CasesController } from './cases.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CasesController],
  providers: [
    {
      provide: CASE_REPOSITORY,
      useClass: DrizzleCaseRepository,
    },
    CaseManagementService,
  ],
})
export class CasesModule {}
