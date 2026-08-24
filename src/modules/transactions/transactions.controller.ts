import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  operatorTransactionQuerySchema,
  OperatorTransactionQueryDto,
  transactionParamsSchema,
  TransactionParamsDto,
} from './dto/transaction-query.dto';
import { TransactionPage, TransactionQueryService } from './transaction-query.service';
import {
  operatorTransactionDetailSchema,
  operatorTransactionPageSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';

@Controller('v1/operator/transactions')
@ApiTags('Transactions')
export class TransactionsController {
  constructor(private readonly transactionQueries: TransactionQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions with decision and alert filters' })
  @ApiQuery({ name: 'clientId', required: false, pattern: '^C\\d{5}$' })
  @ApiQuery({ name: 'cardId', required: false, pattern: '^K\\d{6}$' })
  @ApiQuery({ name: 'merchantId', required: false, pattern: '^M\\d{5}$' })
  @ApiQuery({ name: 'channel', required: false, enum: ['ATM', 'ECOM', 'P2P', 'POS'] })
  @ApiQuery({ name: 'response', required: false, enum: ['OK', 'DECLINED'] })
  @ApiQuery({ name: 'action', required: false, enum: ['APPROVE', 'STEP_UP', 'BLOCK'] })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'minimumAmount', required: false, type: Number })
  @ApiQuery({ name: 'maximumAmount', required: false, type: Number })
  @ApiQuery({ name: 'minimumRiskScore', required: false, type: Number, minimum: 0, maximum: 100 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100, example: 25 })
  @ApiResponse({ status: 200, description: 'Transaction page', schema: operatorTransactionPageSchema })
  @ApiResponse({ status: 400, description: 'Invalid filters or cursor', schema: problemDetailsSchema })
  list(
    @Query(new ZodValidationPipe(operatorTransactionQuerySchema))
    query: OperatorTransactionQueryDto,
  ): Promise<TransactionPage> {
    return this.transactionQueries.listOperator(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one transaction with decision, signals, alert, and case context' })
  @ApiParam({ name: 'id', description: 'Transaction source ID', example: 'T00044999' })
  @ApiResponse({ status: 200, description: 'Transaction detail', schema: operatorTransactionDetailSchema })
  @ApiResponse({ status: 404, description: 'Transaction not found', schema: problemDetailsSchema })
  detail(
    @Param(new ZodValidationPipe(transactionParamsSchema)) params: TransactionParamsDto,
  ) {
    return this.transactionQueries.detailOperator(params.id);
  }
}
