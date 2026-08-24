export type ReplayJobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReplayJobRecord {
  id: string;
  status: ReplayJobStatus;
  totalRows: number;
  processedRows: number;
  alertsCreated: number;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ReplayJobRepository {
  create(): Promise<ReplayJobRecord>;
  findById(id: string): Promise<ReplayJobRecord | null>;
  markRunning(id: string, totalRows: number): Promise<void>;
  setTotalRows(id: string, totalRows: number): Promise<void>;
  updateProgress(id: string, processedRows: number, alertsCreated: number): Promise<void>;
  complete(id: string, processedRows: number, alertsCreated: number): Promise<void>;
  fail(id: string, message: string): Promise<void>;
}

export const REPLAY_JOB_REPOSITORY = Symbol('REPLAY_JOB_REPOSITORY');
