import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  evaluationResponseSchema,
  fraudSignalsExportResponseSchema,
} from '../../presentation/http/openapi/schemas';
import { EvaluationResponse, EvaluationService } from './evaluation.service';
import {
  FraudSignalsExportResult,
  FraudSignalsExportService,
} from './fraud-signals-export.service';

@Controller('v1/admin')
@ApiTags('Evaluation and export')
export class EvaluationController {
  constructor(
    private readonly evaluation: EvaluationService,
    private readonly exporter: FraudSignalsExportService,
  ) {}

  @Post('exports/fraud-signals')
  @ApiOperation({ summary: 'Write the mandatory natija/fraud_signallari.csv submission file' })
  @ApiResponse({
    status: 201,
    description: 'Fraud-signal CSV generated',
    schema: fraudSignalsExportResponseSchema,
  })
  exportFraudSignals(): Promise<FraudSignalsExportResult> {
    return this.exporter.export();
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
