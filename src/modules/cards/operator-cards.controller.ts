import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  operatorCardPageSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';
import { CardQueryService, OperatorCardPage } from './card-query.service';
import { operatorCardQuerySchema, OperatorCardQueryDto } from './dto/card-query.dto';

@Controller('v1/operator/cards')
@ApiTags('Cards')
export class OperatorCardsController {
  constructor(private readonly cardQueries: CardQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List cards, optionally filtered by client' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiResponse({ status: 200, description: 'Operator card page', schema: operatorCardPageSchema })
  @ApiResponse({
    status: 400,
    description: 'Invalid filter or cursor',
    schema: problemDetailsSchema,
  })
  list(
    @Query(new ZodValidationPipe(operatorCardQuerySchema)) query: OperatorCardQueryDto,
  ): Promise<OperatorCardPage> {
    return this.cardQueries.listOperator(query);
  }
}
