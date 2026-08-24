import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ImportDatasetUseCase } from '../../application/import-dataset/import-dataset.use-case';
import {
  REPLAY_JOB_REPOSITORY,
  ReplayJobRecord,
  ReplayJobRepository,
} from '../../application/ports/replay-job.repository';
import { ReplayTransactionsUseCase } from '../../application/replay-transactions/replay-transactions.use-case';
import { FraudSignalsExportService } from '../evaluation/fraud-signals-export.service';

@Injectable()
export class ReplayJobService {
  private activeJob: Promise<void> | null = null;

  constructor(
    private readonly importDataset: ImportDatasetUseCase,
    private readonly replayTransactions: ReplayTransactionsUseCase,
    @Inject(REPLAY_JOB_REPOSITORY) private readonly jobs: ReplayJobRepository,
    private readonly fraudSignalsExport: FraudSignalsExportService,
  ) {}

  async start(): Promise<ReplayJobRecord> {
    if (this.activeJob) {
      throw new ConflictException('A replay job is already running');
    }

    const job = await this.jobs.create();
    const run = Promise.resolve().then(() => this.run(job.id));
    this.activeJob = run;
    void run.finally(() => {
      if (this.activeJob === run) this.activeJob = null;
    });
    return job;
  }

  async get(id: string): Promise<ReplayJobRecord> {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException(`Replay job ${id} was not found`);
    return job;
  }

  private async run(jobId: string): Promise<void> {
    try {
      await this.jobs.markRunning(jobId, 0);
      const imported = await this.importDataset.execute();
      await this.jobs.setTotalRows(jobId, imported.transactions);

      const result = await this.replayTransactions.execute((progress) =>
        this.jobs.updateProgress(jobId, progress.processed, progress.alertsCreated),
      );
      await this.fraudSignalsExport.export();
      await this.jobs.complete(jobId, result.processed, result.alertsCreated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown replay failure';
      await this.jobs.fail(jobId, message);
    }
  }
}
