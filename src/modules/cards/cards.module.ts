import { Module } from '@nestjs/common';
import { CARD_QUERY_REPOSITORY } from '../../application/ports/card-query.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleCardQueryRepository } from '../../infrastructure/persistence/drizzle-card-query.repository';
import { CardQueryService } from './card-query.service';
import { CustomerCardsController } from './customer-cards.controller';
import { OperatorCardsController } from './operator-cards.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [OperatorCardsController, CustomerCardsController],
  providers: [
    {
      provide: CARD_QUERY_REPOSITORY,
      useClass: DrizzleCardQueryRepository,
    },
    CardQueryService,
  ],
})
export class CardsModule {}
