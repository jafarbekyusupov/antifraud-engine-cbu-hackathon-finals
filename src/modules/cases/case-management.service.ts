import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CASE_REPOSITORY,
  CaseRepository,
  InvestigationCase,
} from '../../application/ports/case.repository';
import { OpenCaseBodyDto, UpdateCaseBodyDto } from './dto';

@Injectable()
export class CaseManagementService {
  constructor(@Inject(CASE_REPOSITORY) private readonly cases: CaseRepository) {}

  async open(alertId: string, input: OpenCaseBodyDto): Promise<InvestigationCase> {
    const result = await this.cases.open({ alertId, note: input.note });
    if (result.kind === 'alert-not-found') {
      throw new NotFoundException(`Alert ${alertId} was not found`);
    }
    return result.value;
  }

  async detail(id: string): Promise<InvestigationCase> {
    const result = await this.cases.findById(id);
    if (!result) throw new NotFoundException(`Case ${id} was not found`);
    return result;
  }

  async update(id: string, input: UpdateCaseBodyDto): Promise<InvestigationCase> {
    const result = await this.cases.update(id, input);
    if (result.kind === 'case-not-found') {
      throw new NotFoundException(`Case ${id} was not found`);
    }
    if (result.kind === 'invalid-transition') {
      throw new ConflictException(`Case cannot transition from ${result.from} to ${result.to}`);
    }
    return result.value;
  }
}
