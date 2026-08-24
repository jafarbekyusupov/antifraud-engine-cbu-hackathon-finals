import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChallengeResponseRecord } from '../../application/ports/security-challenge.repository';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  customerChallengeDetailSchema,
  customerChallengePageSchema,
  customerChallengeResponseRequestSchema,
  customerChallengeResponseSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';
import { CustomerChallengeDetail, CustomerChallengePage, CustomerSecurityService } from './customer-security.service';
import {
  authenticatedClientIdSchema,
  idempotencyKeySchema,
  RespondToSecurityChallengeDto,
  respondToSecurityChallengeSchema,
  SecurityChallengeParamsDto,
  securityChallengeParamsSchema,
} from './dto/security-challenge.dto';

@Controller('v1/customer/security-challenges')
@ApiTags('Customer security')
@ApiHeader({
  name: 'x-authenticated-client-id',
  required: true,
  description: 'Trusted identity injected after access-token validation; temporary MVP integration',
  example: 'C00426',
})
export class CustomerSecurityController {
  constructor(private readonly customerSecurity: CustomerSecurityService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated customer’s security challenges' })
  @ApiResponse({
    status: 200,
    description: 'Customer challenge list',
    schema: customerChallengePageSchema,
  })
  list(@Headers('x-authenticated-client-id') clientId: string | undefined): Promise<CustomerChallengePage> {
    return this.customerSecurity.list(this.parseClientId(clientId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer-safe suspicious transaction summary' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Customer challenge detail',
    schema: customerChallengeDetailSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'Challenge not found for this customer',
    schema: problemDetailsSchema,
  })
  detail(
    @Param(new ZodValidationPipe(securityChallengeParamsSchema))
    params: SecurityChallengeParamsDto,
    @Headers('x-authenticated-client-id') clientId: string | undefined,
  ): Promise<CustomerChallengeDetail> {
    return this.customerSecurity.detail(params.id, this.parseClientId(clientId));
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Confirm or deny a suspicious transaction with device context' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiBody({
    description: 'Customer decision, device location, and timezone context',
    schema: customerChallengeResponseRequestSchema,
  })
  @ApiResponse({
    status: 201,
    description: 'Verification resolution',
    schema: customerChallengeResponseSchema,
  })
  @ApiResponse({
    status: 409,
    description: 'Expired or already answered challenge',
    schema: problemDetailsSchema,
  })
  respond(
    @Param(new ZodValidationPipe(securityChallengeParamsSchema))
    params: SecurityChallengeParamsDto,
    @Headers('x-authenticated-client-id') clientId: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(respondToSecurityChallengeSchema))
    body: RespondToSecurityChallengeDto,
  ): Promise<ChallengeResponseRecord> {
    return this.customerSecurity.respond(
      params.id,
      this.parseClientId(clientId),
      this.parseIdempotencyKey(idempotencyKey),
      body,
    );
  }

  private parseClientId(value: string | undefined): string {
    return new ZodValidationPipe(authenticatedClientIdSchema).transform(value);
  }

  private parseIdempotencyKey(value: string | undefined): string {
    return new ZodValidationPipe(idempotencyKeySchema).transform(value);
  }
}
