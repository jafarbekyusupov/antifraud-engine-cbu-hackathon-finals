import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AlertDetail } from '../../application/ports/alert-query.repository';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  alertDetailSchema,
  alertPageSchema,
  problemDetailsSchema,
} from '../../presentation/http/openapi/schemas';
import { AlertPage, AlertQueryService } from './alert-query.service';
import { ListAlertsQueryDto, listAlertsQuerySchema } from './dto';

const alertParamsSchema = z.strictObject({ id: z.uuid() });

@Controller('v1/operator/alerts')
@ApiTags('Alerts')
export class AlertsController {
  constructor(private readonly alertQueries: AlertQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List fraud alerts using descending cursor pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'] })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'minimumRiskScore', required: false, type: Number, minimum: 0, maximum: 100 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, minimum: 1, maximum: 100, example: 25 })
  @ApiResponse({ status: 200, description: 'Alert page', schema: alertPageSchema })
  @ApiResponse({ status: 400, description: 'Invalid filter or cursor', schema: problemDetailsSchema })
  list(
    @Query(new ZodValidationPipe(listAlertsQuerySchema)) query: ListAlertsQueryDto,
  ): Promise<AlertPage> {
    return this.alertQueries.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert, transaction, signals, and linked case context' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Alert detail', schema: alertDetailSchema })
  @ApiResponse({ status: 404, description: 'Alert not found', schema: problemDetailsSchema })
  detail(
    @Param(new ZodValidationPipe(alertParamsSchema)) params: z.infer<typeof alertParamsSchema>,
  ): Promise<AlertDetail> {
    return this.alertQueries.detail(params.id);
  }
}
