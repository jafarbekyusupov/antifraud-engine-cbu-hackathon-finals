import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '../../database/database.module';
import { HealthController } from './health.controller';

@Module({
  imports: [DatabaseModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
