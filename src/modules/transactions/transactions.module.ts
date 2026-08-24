import { Module } from '@nestjs/common';
import { TRANSACTION_QUERY_REPOSITORY } from '../../application/ports/transaction-query.repository';
import { DatabaseModule } from '../../database/database.module';
import { DrizzleTransactionQueryRepository } from '../../infrastructure/persistence/drizzle-transaction-query.repository';
import { CustomerTransactionsController } from './customer-transactions.controller';
import { TransactionQueryService } from './transaction-query.service';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionsController, CustomerTransactionsController],
  providers: [
    {
      provide: TRANSACTION_QUERY_REPOSITORY,
      useClass: DrizzleTransactionQueryRepository,
    },
    TransactionQueryService,
  ],
})
export class TransactionsModule {}
