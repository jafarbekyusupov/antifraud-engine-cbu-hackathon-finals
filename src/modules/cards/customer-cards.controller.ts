import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  customerCardPageSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';
import { authenticatedClientIdSchema } from '../customer-security/dto/security-challenge.dto';
import { CardQueryService, CustomerCardPage } from './card-query.service';
import { customerCardQuerySchema, CustomerCardQueryDto } from './dto/card-query.dto';

@Controller('v1/customer/cards')
@ApiTags('Customer cards')
@ApiHeader({
  name: 'x-authenticated-client-id',
  required: true,
  description: 'Trusted identity injected after access-token validation; temporary MVP integration',
  example: 'C00426',
})
export class CustomerCardsController {
  constructor(private readonly cardQueries: CardQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List only the authenticated customer’s cards' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiResponse({ status: 200, description: 'Customer card page', schema: customerCardPageSchema })
  @ApiResponse({
    status: 400,
    description: 'Invalid header or cursor',
    schema: problemDetailsSchema,
  })
  list(
    @Headers('x-authenticated-client-id') clientId: string | undefined,
    @Query(new ZodValidationPipe(customerCardQuerySchema)) query: CustomerCardQueryDto,
  ): Promise<CustomerCardPage> {
    return this.cardQueries.listCustomer(this.parseClientId(clientId), query);
  }

  private parseClientId(value: string | undefined): string {
    return new ZodValidationPipe(authenticatedClientIdSchema).transform(value);
  }
}
