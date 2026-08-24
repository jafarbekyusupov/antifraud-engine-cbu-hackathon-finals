import { Inject, Injectable } from '@nestjs/common';
import {
  FRAUD_LABEL_READER,
  FRAUD_PREDICTION_REPOSITORY,
  FraudLabelReader,
  FraudPredictionRepository,
} from '../../application/ports/fraud-evaluation.repository';
import { RISK_ENGINE } from '../../application/replay-transactions/replay-transactions.use-case';
import {
  FraudEvaluationResult,
  evaluateFraudPredictions,
} from '../../domain/services/fraud-evaluation';
import { RiskEngine } from '../../domain/services/risk-engine';

export interface EvaluationResponse extends FraudEvaluationResult {
  ruleVersion: string;
  evaluatedAt: Date;
}

@Injectable()
export class EvaluationService {
  constructor(
    @Inject(FRAUD_PREDICTION_REPOSITORY)
    private readonly predictions: FraudPredictionRepository,
    @Inject(FRAUD_LABEL_READER) private readonly labels: FraudLabelReader,
    @Inject(RISK_ENGINE) private readonly riskEngine: RiskEngine,
  ) {}

  async evaluate(): Promise<EvaluationResponse> {
    const [predictions, totalTransactions] = await Promise.all([
      this.predictions.listBlocked(this.riskEngine.ruleVersion),
      this.predictions.countTransactions(),
    ]);
    const actualPatterns = new Map<string, string>();
    for await (const label of this.labels.readPositiveLabels()) {
      actualPatterns.set(label.transactionId, label.pattern);
    }

    return {
      ruleVersion: this.riskEngine.ruleVersion,
      evaluatedAt: new Date(),
      ...evaluateFraudPredictions({
        totalTransactions,
        predictedIds: new Set(predictions.map((prediction) => prediction.transactionId)),
        actualPatterns,
      }),
    };
  }
}
