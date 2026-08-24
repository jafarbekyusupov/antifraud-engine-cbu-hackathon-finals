import { Inject, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FRAUD_PREDICTION_REPOSITORY,
  FraudPredictionRepository,
} from '../../application/ports/fraud-evaluation.repository';
import { RISK_ENGINE } from '../../application/replay-transactions/replay-transactions.use-case';
import { AppConfig } from '../../config/app.config';
import { RiskEngine } from '../../domain/services/risk-engine';

export interface FraudSignalsExportResult {
  file: 'natija/fraud_signallari.csv';
  predictionCount: number;
  ruleVersion: string;
}

@Injectable()
export class FraudSignalsExportService {
  constructor(
    @Inject(FRAUD_PREDICTION_REPOSITORY)
    private readonly predictions: FraudPredictionRepository,
    @Inject(RISK_ENGINE) private readonly riskEngine: RiskEngine,
    private readonly config: AppConfig,
  ) {}

  async export(): Promise<FraudSignalsExportResult> {
    const records = await this.predictions.listBlocked(this.riskEngine.ruleVersion);
    const rows = [
      'tx_id,risk_ball,sabab',
      ...records.map((record) =>
        [record.transactionId, record.riskScore, record.reasons.join('; ')].map(csvCell).join(','),
      ),
    ];

    await mkdir(this.config.resultDirectory, { recursive: true });
    await writeFile(
      join(this.config.resultDirectory, 'fraud_signallari.csv'),
      `${rows.join('\n')}\n`,
      'utf8',
    );

    return {
      file: 'natija/fraud_signallari.csv',
      predictionCount: records.length,
      ruleVersion: this.riskEngine.ruleVersion,
    };
  }
}

function csvCell(value: number | string): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
