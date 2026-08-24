import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  CaseRepository,
  CaseStatus,
  InvestigationCase,
  OpenCaseInput,
  OpenCaseResult,
  UpdateCaseInput,
  UpdateCaseResult,
} from '../../application/ports/case.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { alerts, caseEvents, investigationCases } from '../../database/schemas';
import { canTransitionCase } from '../../domain/services/case-status-transition';

function alertStatusForCase(
  status: CaseStatus,
): 'OPEN' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED' {
  if (status === 'CONFIRMED' || status === 'FALSE_POSITIVE' || status === 'CLOSED') {
    return status;
  }
  return 'OPEN';
}

@Injectable()
export class DrizzleCaseRepository implements CaseRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async open(input: OpenCaseInput): Promise<OpenCaseResult> {
    const result = await this.database.transaction(async (transaction) => {
      const [alert] = await transaction
        .select({ id: alerts.id })
        .from(alerts)
        .where(eq(alerts.id, input.alertId))
        .limit(1);
      if (!alert) return { kind: 'alert-not-found' as const };

      const [created] = await transaction
        .insert(investigationCases)
        .values({ alertId: input.alertId, note: input.note })
        .onConflictDoNothing({ target: investigationCases.alertId })
        .returning({ id: investigationCases.id });

      if (created) {
        await transaction.insert(caseEvents).values({
          caseId: created.id,
          eventType: 'CASE_OPENED',
          payload: { alertId: input.alertId, note: input.note ?? null },
        });
        return { kind: 'ok' as const, id: created.id, created: true };
      }

      const [existing] = await transaction
        .select({ id: investigationCases.id })
        .from(investigationCases)
        .where(eq(investigationCases.alertId, input.alertId))
        .limit(1);
      if (!existing) {
        throw new Error(`Case for alert ${input.alertId} was not found after an insert conflict`);
      }
      return { kind: 'ok' as const, id: existing.id, created: false };
    });

    if (result.kind === 'alert-not-found') return result;
    const value = await this.findById(result.id);
    if (!value) throw new Error(`Case ${result.id} disappeared after it was opened`);
    return { kind: 'ok', value, created: result.created };
  }

  async findById(id: string): Promise<InvestigationCase | null> {
    const [row] = await this.database
      .select()
      .from(investigationCases)
      .where(eq(investigationCases.id, id))
      .limit(1);
    if (!row) return null;

    const events = await this.database
      .select()
      .from(caseEvents)
      .where(eq(caseEvents.caseId, id))
      .orderBy(asc(caseEvents.createdAt), asc(caseEvents.id));

    return { ...row, events };
  }

  async update(id: string, input: UpdateCaseInput): Promise<UpdateCaseResult> {
    const result = await this.database.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(investigationCases)
        .where(eq(investigationCases.id, id))
        .for('update')
        .limit(1);
      if (!existing) return { kind: 'case-not-found' as const };

      const nextStatus = input.status ?? existing.status;
      if (!canTransitionCase(existing.status, nextStatus)) {
        return {
          kind: 'invalid-transition' as const,
          from: existing.status,
          to: nextStatus,
        };
      }

      const now = new Date();
      await transaction
        .update(investigationCases)
        .set({
          status: nextStatus,
          note: input.note ?? existing.note,
          closedAt: nextStatus === 'CLOSED' ? (existing.closedAt ?? now) : existing.closedAt,
          updatedAt: now,
        })
        .where(eq(investigationCases.id, id));

      if (nextStatus !== existing.status) {
        await transaction.insert(caseEvents).values({
          caseId: id,
          eventType: 'STATUS_CHANGED',
          payload: { from: existing.status, to: nextStatus },
        });
        await transaction
          .update(alerts)
          .set({ status: alertStatusForCase(nextStatus), updatedAt: now })
          .where(eq(alerts.id, existing.alertId));
      }

      if (input.note !== undefined) {
        await transaction.insert(caseEvents).values({
          caseId: id,
          eventType: 'NOTE_ADDED',
          payload: { note: input.note },
        });
      }

      return { kind: 'ok' as const };
    });

    if (result.kind !== 'ok') return result;
    const value = await this.findById(id);
    if (!value) throw new Error(`Case ${id} disappeared after it was updated`);
    return { kind: 'ok', value };
  }
}
