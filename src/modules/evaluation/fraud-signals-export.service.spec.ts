import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FraudPredictionRepository } from '../../application/ports/fraud-evaluation.repository';
import { AppConfig } from '../../config/app.config';
import { RiskEngine } from '../../domain/services/risk-engine';
import { FraudSignalsExportService } from './fraud-signals-export.service';

describe('FraudSignalsExportService', () => {
  it('writes and returns the exact required CSV', async () => {
    const resultDirectory = await mkdtemp(join(tmpdir(), 'fraud-signals-'));
    const predictions: FraudPredictionRepository = {
      listBlocked: jest.fn().mockResolvedValue([
        {
          transactionId: 'T00000001',
          riskScore: 70,
          reasons: ['Velocity, "fast"'],
        },
      ]),
      countTransactions: jest.fn().mockResolvedValue(1),
    };
    const config = { resultDirectory } as AppConfig;
    const service = new FraudSignalsExportService(predictions, RiskEngine.createDefault(), config);

    try {
      const result = await service.export();
      const saved = await readFile(join(resultDirectory, 'fraud_signallari.csv'), 'utf8');

      expect(result).toMatchObject({
        file: 'natija/fraud_signallari.csv',
        predictionCount: 1,
        ruleVersion: 'v1',
      });
      expect(result.csv).toBe('tx_id,risk_ball,sabab\nT00000001,70,"Velocity, ""fast"""\n');
      expect(saved).toBe(result.csv);
    } finally {
      await rm(resultDirectory, { recursive: true, force: true });
    }
  });
});
