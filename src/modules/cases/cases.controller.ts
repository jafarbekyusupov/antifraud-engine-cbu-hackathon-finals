import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvestigationCase } from '../../application/ports/case.repository';
import { ZodValidationPipe } from '../../presentation/http/common/zod-validation.pipe';
import {
  investigationCaseSchema,
  openCaseRequestSchema,
  problemDetailsSchema,
  updateCaseRequestSchema,
} from '../../presentation/http/openapi/schemas';
import { CaseManagementService } from './case-management.service';
import {
  CaseParamsDto,
  caseParamsSchema,
  OpenCaseBodyDto,
  openCaseBodySchema,
  UpdateCaseBodyDto,
  updateCaseBodySchema,
} from './dto';

@Controller('v1/operator')
@ApiTags('Cases')
export class CasesController {
  constructor(private readonly cases: CaseManagementService) {}

  @Post('alerts/:id/case')
  @ApiOperation({ summary: 'Open or return the existing case for an alert' })
  @ApiParam({ name: 'id', description: 'Alert UUID', format: 'uuid' })
  @ApiBody({ schema: openCaseRequestSchema })
  @ApiResponse({ status: 201, description: 'Investigation case', schema: investigationCaseSchema })
  @ApiResponse({ status: 404, description: 'Alert not found', schema: problemDetailsSchema })
  open(
    @Param(new ZodValidationPipe(caseParamsSchema)) params: CaseParamsDto,
    @Body(new ZodValidationPipe(openCaseBodySchema)) body: OpenCaseBodyDto,
  ): Promise<InvestigationCase> {
    return this.cases.open(params.id, body);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a case and its append-only event timeline' })
  @ApiParam({ name: 'id', description: 'Case UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Investigation case', schema: investigationCaseSchema })
  @ApiResponse({ status: 404, description: 'Case not found', schema: problemDetailsSchema })
  detail(
    @Param(new ZodValidationPipe(caseParamsSchema)) params: CaseParamsDto,
  ): Promise<InvestigationCase> {
    return this.cases.detail(params.id);
  }

  @Patch('cases/:id')
  @ApiOperation({ summary: 'Change case status and/or append an analyst note' })
  @ApiParam({ name: 'id', description: 'Case UUID', format: 'uuid' })
  @ApiBody({ schema: updateCaseRequestSchema })
  @ApiResponse({ status: 200, description: 'Updated investigation case', schema: investigationCaseSchema })
  @ApiResponse({ status: 400, description: 'Invalid update', schema: problemDetailsSchema })
  @ApiResponse({ status: 404, description: 'Case not found', schema: problemDetailsSchema })
  @ApiResponse({ status: 409, description: 'Invalid status transition', schema: problemDetailsSchema })
  update(
    @Param(new ZodValidationPipe(caseParamsSchema)) params: CaseParamsDto,
    @Body(new ZodValidationPipe(updateCaseBodySchema)) body: UpdateCaseBodyDto,
  ): Promise<InvestigationCase> {
    return this.cases.update(params.id, body);
  }
}
