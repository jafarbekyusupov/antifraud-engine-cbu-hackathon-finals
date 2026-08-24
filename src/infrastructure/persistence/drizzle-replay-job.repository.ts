import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ReplayJobRecord,
  ReplayJobRepository,
} from '../../application/ports/replay-job.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { replayJobs } from '../../database/schemas';

@Injectable()
export class DrizzleReplayJobRepository implements ReplayJobRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async create(): Promise<ReplayJobRecord> {
    const [created] = await this.database.insert(replayJobs).values({}).returning();
    if (!created) throw new Error('Replay job creation did not return a row');
    return created;
  }

  async findById(id: string): Promise<ReplayJobRecord | null> {
    const [record] = await this.database
      .select()
      .from(replayJobs)
      .where(eq(replayJobs.id, id))
      .limit(1);
    return record ?? null;
  }

  async markRunning(id: string, totalRows: number): Promise<void> {
    await this.database
      .update(replayJobs)
      .set({ status: 'RUNNING', totalRows, startedAt: new Date(), errorMessage: null })
      .where(eq(replayJobs.id, id));
  }

  async setTotalRows(id: string, totalRows: number): Promise<void> {
    await this.database.update(replayJobs).set({ totalRows }).where(eq(replayJobs.id, id));
  }

  async updateProgress(id: string, processedRows: number, alertsCreated: number): Promise<void> {
    await this.database
      .update(replayJobs)
      .set({ processedRows, alertsCreated })
      .where(eq(replayJobs.id, id));
  }

  async complete(id: string, processedRows: number, alertsCreated: number): Promise<void> {
    await this.database
      .update(replayJobs)
      .set({
        status: 'COMPLETED',
        processedRows,
        alertsCreated,
        completedAt: new Date(),
      })
      .where(eq(replayJobs.id, id));
  }

  async fail(id: string, message: string): Promise<void> {
    await this.database
      .update(replayJobs)
      .set({ status: 'FAILED', errorMessage: message.slice(0, 4_000), completedAt: new Date() })
      .where(eq(replayJobs.id, id));
  }
}
