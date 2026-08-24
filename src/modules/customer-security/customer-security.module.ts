import { Module } from '@nestjs/common';
import { SECURITY_CHALLENGE_REPOSITORY } from '../../application/ports/security-challenge.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleSecurityChallengeRepository } from '../../infrastructure/persistence/drizzle-security-challenge.repository';
import { CustomerSecurityController } from './customer-security.controller';
import { CustomerSecurityService } from './customer-security.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerSecurityController],
  providers: [
    {
      provide: SECURITY_CHALLENGE_REPOSITORY,
      useClass: DrizzleSecurityChallengeRepository,
    },
    CustomerSecurityService,
  ],
})
export class CustomerSecurityModule {}
