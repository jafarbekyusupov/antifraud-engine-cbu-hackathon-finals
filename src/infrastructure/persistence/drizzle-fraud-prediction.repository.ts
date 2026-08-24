import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import {
  FraudPrediction,
  FraudPredictionRepository,
} from '../../application/ports/fraud-evaluation.repository';
import { AntiFraudDatabase } from '../../database/database.types';
import { DATABASE } from '../../database/database.tokens';
import { decisions, transactions } from '../../database/schemas';

@Injectable()
export class DrizzleFraudPredictionRepository implements FraudPredictionRepository {
  constructor(@Inject(DATABASE) private readonly database: AntiFraudDatabase) {}

  async listBlocked(ruleVersion: string): Promise<readonly FraudPrediction[]> {
    const rows = await this.database
      .select({
        transactionId: decisions.transactionId,
        riskScore: decisions.riskScore,
        signals: decisions.signals,
      })
      .from(decisions)
      .where(and(eq(decisions.ruleVersion, ruleVersion), eq(decisions.action, 'BLOCK')))
      .orderBy(asc(decisions.transactionId));

    return rows.map((row) => ({
      transactionId: row.transactionId,
      riskScore: row.riskScore,
      reasons: row.signals.map((signal) => signal.message),
    }));
  }

  async countTransactions(): Promise<number> {
    const [row] = await this.database.select({ count: count() }).from(transactions);
    return row?.count ?? 0;
  }
}
