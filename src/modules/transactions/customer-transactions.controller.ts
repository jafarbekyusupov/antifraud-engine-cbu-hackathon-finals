import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  customerTransactionDetailSchema,
  customerTransactionPageSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';
import {
  authenticatedClientIdSchema,
} from '../customer-security/dto/security-challenge.dto';
import {
  customerTransactionQuerySchema,
  CustomerTransactionQueryDto,
  transactionParamsSchema,
  TransactionParamsDto,
} from './dto/transaction-query.dto';
import {
  CustomerTransactionPage,
  TransactionQueryService,
} from './transaction-query.service';

@Controller('v1/customer/transactions')
@ApiTags('Customer transactions')
@ApiHeader({
  name: 'x-authenticated-client-id',
  required: true,
  description: 'Trusted identity injected after access-token validation; temporary MVP integration',
  example: 'C00426',
})
export class CustomerTransactionsController {
  constructor(private readonly transactionQueries: TransactionQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List only the authenticated customer’s transactions' })
  @ApiResponse({ status: 200, description: 'Customer transaction page', schema: customerTransactionPageSchema })
  @ApiResponse({ status: 400, description: 'Invalid filters or cursor', schema: problemDetailsSchema })
  list(
    @Headers('x-authenticated-client-id') clientId: string | undefined,
    @Query(new ZodValidationPipe(customerTransactionQuerySchema))
    query: CustomerTransactionQueryDto,
  ): Promise<CustomerTransactionPage> {
    return this.transactionQueries.listCustomer(this.parseClientId(clientId), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one customer-safe transaction detail' })
  @ApiParam({ name: 'id', description: 'Transaction source ID', example: 'T00044999' })
  @ApiResponse({ status: 200, description: 'Customer transaction detail', schema: customerTransactionDetailSchema })
  @ApiResponse({ status: 404, description: 'Transaction not found for this customer', schema: problemDetailsSchema })
  detail(
    @Headers('x-authenticated-client-id') clientId: string | undefined,
    @Param(new ZodValidationPipe(transactionParamsSchema)) params: TransactionParamsDto,
  ) {
    return this.transactionQueries.detailCustomer(params.id, this.parseClientId(clientId));
  }

  private parseClientId(value: string | undefined): string {
    return new ZodValidationPipe(authenticatedClientIdSchema).transform(value);
  }
}
