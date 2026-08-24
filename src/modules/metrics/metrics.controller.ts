import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardMetrics } from '../../application/ports/metrics.repository';
import { dashboardMetricsSchema } from '../../presentation/http/openapi/schemas';
import { MetricsService } from './metrics.service';

@Controller('v1/operator/metrics')
@ApiTags('Metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard volumes, decisions, workflow states, and latency' })
  @ApiResponse({
    status: 200,
    description: 'Current dashboard summary',
    schema: dashboardMetricsSchema,
  })
  summary(): Promise<DashboardMetrics> {
    return this.metrics.getDashboard();
  }
}
