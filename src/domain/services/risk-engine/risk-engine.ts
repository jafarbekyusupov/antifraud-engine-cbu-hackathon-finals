import { Transaction } from '../../entities';
import { RiskSignal } from '../../value-objects';
import { RiskContext } from './risk-context';
import { RiskRule } from './risk-rule';
import { AmountAnomalyRule } from './rules/amount-anomaly.rule';
import { CardTestingRule } from './rules/card-testing.rule';
import { ColdStartRule } from './rules/cold-start.rule';
import { ImpossibleTravelRule } from './rules/impossible-travel.rule';
import { VelocityRule } from './rules/velocity.rule';

export type DecisionAction = 'APPROVE' | 'STEP_UP' | 'BLOCK';

export interface RiskEngineConfig {
  stepUpThreshold: number;
  blockThreshold: number;
  secondarySignalWeight: number;
  ruleVersion: string;
}

export interface RiskAssessment {
  riskScore: number;
  action: DecisionAction;
  signals: readonly RiskSignal[];
  ruleVersion: string;
}

const DEFAULT_CONFIG: RiskEngineConfig = {
  stepUpThreshold: 40,
  blockThreshold: 70,
  secondarySignalWeight: 0.4,
  ruleVersion: 'v1',
};

export class RiskEngine {
  constructor(
    private readonly rules: readonly RiskRule[],
    private readonly config: RiskEngineConfig = DEFAULT_CONFIG,
  ) {
    if (config.stepUpThreshold >= config.blockThreshold) {
      throw new Error('Step-up threshold must be below the block threshold');
    }
  }

  static createDefault(config: RiskEngineConfig = DEFAULT_CONFIG): RiskEngine {
    return new RiskEngine(
      [
        new VelocityRule(),
        new ImpossibleTravelRule(),
        new AmountAnomalyRule(),
        new CardTestingRule(),
        new ColdStartRule(),
      ],
      config,
    );
  }

  get ruleVersion(): string {
    return this.config.ruleVersion;
  }

  assess(transaction: Transaction, context: RiskContext): RiskAssessment {
    const signals = this.rules
      .map((rule) => rule.evaluate(transaction, context))
      .filter((signal): signal is RiskSignal => signal !== null)
      .sort((left, right) => right.score.value - left.score.value);

    const [strongest, ...secondary] = signals;
    const secondaryTotal = secondary.reduce((total, signal) => total + signal.score.value, 0);
    const riskScore = Math.min(
      100,
      Math.round(
        (strongest?.score.value ?? 0) + secondaryTotal * this.config.secondarySignalWeight,
      ),
    );

    return {
      riskScore,
      action: this.actionFor(riskScore),
      signals,
      ruleVersion: this.config.ruleVersion,
    };
  }

  private actionFor(score: number): DecisionAction {
    if (score >= this.config.blockThreshold) return 'BLOCK';
    if (score >= this.config.stepUpThreshold) return 'STEP_UP';
    return 'APPROVE';
  }
}
