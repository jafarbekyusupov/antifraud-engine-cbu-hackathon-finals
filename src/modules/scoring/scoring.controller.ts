import { Body, Controller, Post, UnprocessableEntityException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ScoreTransactionUseCase,
  ScoringReferenceNotFoundError,
} from '../../application/score-transaction/score-transaction.use-case';
import { ScoreTransactionResult } from '../../application/ports/scoring.repository';
import { Transaction } from '../../domain/entities';
import { GeoPoint } from '../../domain/value-objects';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  problemDetailsSchema,
  scoreResponseSchema,
  transactionRequestSchema,
} from '../../presentation/http/openapi/schemas';
import { ScoreTransactionDto, scoreTransactionSchema } from './dto/score-transaction.dto';

@Controller('v1/internal/transactions')
@ApiTags('Transaction scoring')
export class ScoringController {
  constructor(private readonly scoreTransaction: ScoreTransactionUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Score one transaction synchronously',
    description:
      'Idempotent by transaction ID and rule version. Persists the transaction and append-only decision; creates an alert when the action is BLOCK.',
  })
  @ApiBody({ schema: transactionRequestSchema })
  @ApiResponse({ status: 201, description: 'Transaction decision', schema: scoreResponseSchema })
  @ApiResponse({ status: 400, description: 'Invalid request', schema: problemDetailsSchema })
  @ApiResponse({
    status: 422,
    description: 'Card, client, or merchant reference data is missing or inconsistent',
    schema: problemDetailsSchema,
  })
  async score(
    @Body(new ZodValidationPipe(scoreTransactionSchema)) body: ScoreTransactionDto,
  ): Promise<ScoreTransactionResult> {
    const transaction = Transaction.create({
      id: body.transactionId,
      cardId: body.cardId,
      clientId: body.clientId,
      occurredAt: new Date(body.occurredAt),
      amount: body.amount,
      currency: body.currency,
      merchantId: body.merchantId,
      mcc: body.mcc,
      city: body.city,
      location: GeoPoint.create(body.latitude, body.longitude),
      channel: body.channel,
      response: body.response,
    });

    try {
      return await this.scoreTransaction.execute(transaction);
    } catch (error) {
      if (error instanceof ScoringReferenceNotFoundError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }
}
