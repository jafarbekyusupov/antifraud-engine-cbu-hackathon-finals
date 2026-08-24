import { Module } from '@nestjs/common';
import { ALERT_QUERY_REPOSITORY } from '../../application/ports/alert-query.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleAlertQueryRepository } from '../../infrastructure/persistence/drizzle-alert-query.repository';
import { AlertQueryService } from './alert-query.service';
import { AlertsController } from './alerts.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AlertsController],
  providers: [
    {
      provide: ALERT_QUERY_REPOSITORY,
      useClass: DrizzleAlertQueryRepository,
    },
    AlertQueryService,
  ],
})
export class AlertsModule {}
