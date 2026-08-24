import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ReplayJobRecord } from '../../application/ports/replay-job.repository';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import { problemDetailsSchema, replayJobSchema } from '../../presentation/http/openapi/schemas';
import { ReplayJobService } from './replay-job.service';

const replayJobParamsSchema = z.strictObject({ id: z.uuid() });

@Controller('v1/admin/replay-jobs')
@ApiTags('Dataset replay')
export class ReplayJobController {
  constructor(private readonly replayJobs: ReplayJobService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Import and replay the configured CSV dataset',
    description:
      'Reads clients.csv, cards.csv, merchants.csv, and transactions.csv from DATA_DIR in bounded chunks, then scores transactions chronologically in the background.',
  })
  @ApiResponse({ status: 202, description: 'Replay job accepted', schema: replayJobSchema })
  @ApiResponse({ status: 409, description: 'Another replay is active', schema: problemDetailsSchema })
  start(): Promise<ReplayJobRecord> {
    return this.replayJobs.start();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read replay progress and final status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Replay job', schema: replayJobSchema })
  @ApiResponse({ status: 404, description: 'Replay job not found', schema: problemDetailsSchema })
  get(
    @Param(new ZodValidationPipe(replayJobParamsSchema))
    params: z.infer<typeof replayJobParamsSchema>,
  ): Promise<ReplayJobRecord> {
    return this.replayJobs.get(params.id);
  }
}
