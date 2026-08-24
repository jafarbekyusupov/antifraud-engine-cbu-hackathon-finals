export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED';
export type CaseEventType = 'CASE_OPENED' | 'STATUS_CHANGED' | 'NOTE_ADDED';

export interface CaseEventRecord {
  id: number;
  eventType: CaseEventType;
  payload: Record<string, boolean | number | string | null>;
  createdAt: Date;
}

export interface InvestigationCase {
  id: string;
  alertId: string;
  status: CaseStatus;
  note: string | null;
  openedAt: Date;
  closedAt: Date | null;
  updatedAt: Date;
  events: readonly CaseEventRecord[];
}

export interface OpenCaseInput {
  alertId: string;
  note?: string;
}

export interface UpdateCaseInput {
  status?: CaseStatus;
  note?: string;
}

export type OpenCaseResult =
  { kind: 'ok'; value: InvestigationCase; created: boolean } | { kind: 'alert-not-found' };

export type UpdateCaseResult =
  | { kind: 'ok'; value: InvestigationCase }
  | { kind: 'case-not-found' }
  | { kind: 'invalid-transition'; from: CaseStatus; to: CaseStatus };

export interface CaseRepository {
  open(input: OpenCaseInput): Promise<OpenCaseResult>;
  findById(id: string): Promise<InvestigationCase | null>;
  update(id: string, input: UpdateCaseInput): Promise<UpdateCaseResult>;
}

export const CASE_REPOSITORY = Symbol('CASE_REPOSITORY');
