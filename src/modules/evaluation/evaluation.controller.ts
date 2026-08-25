import { Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { evaluationResponseSchema } from '../../presentation/http/openapi/schemas';
import { EvaluationResponse, EvaluationService } from './evaluation.service';
import { FraudSignalsExportService } from './fraud-signals-export.service';

@Controller('v1/admin')
@ApiTags('Evaluation and export')
export class EvaluationController {
  constructor(
    private readonly evaluation: EvaluationService,
    private readonly exporter: FraudSignalsExportService,
  ) {}

  @Post('exports/fraud-signals')
  @HttpCode(HttpStatus.OK)
  @ApiProduces('text/csv')
  @ApiOperation({
    summary: 'Generate and download the mandatory fraud-signals CSV',
    description:
      'Writes natija/fraud_signallari.csv and returns the exact same bytes as a downloadable CSV.',
  })
  @ApiResponse({
    status: 200,
    description: 'Generated fraud-signals CSV',
    content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
  })
  async exportFraudSignals(@Res({ passthrough: true }) response: FastifyReply): Promise<string> {
    const result = await this.exporter.export();
    response.header('Content-Type', 'text/csv; charset=utf-8');
    response.header('Content-Disposition', 'attachment; filename="fraud_signallari.csv"');
    response.header('X-Prediction-Count', String(result.predictionCount));
    response.header('X-Rule-Version', result.ruleVersion);
    return result.csv;
  }

  @Get('evaluation')
  @ApiOperation({
    summary: 'Evaluate current blocked predictions against the local answer key',
    description: 'Offline/admin-only; labels are never exposed to the runtime risk engine.',
  })
  @ApiResponse({
    status: 200,
    description: 'Precision, recall, F1 and pattern recall',
    schema: evaluationResponseSchema,
  })
  evaluate(): Promise<EvaluationResponse> {
    return this.evaluation.evaluate();
  }
}
