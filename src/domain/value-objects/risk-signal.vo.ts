import { RiskScore } from './risk-score.vo';

export type RiskEvidenceValue = boolean | number | string | null;

export interface RiskSignalProps {
  code: string;
  score: number;
  message: string;
  evidence?: Record<string, RiskEvidenceValue>;
}

export class RiskSignal {
  readonly code: string;
  readonly score: RiskScore;
  readonly message: string;
  readonly evidence: Readonly<Record<string, RiskEvidenceValue>>;

  private constructor(props: RiskSignalProps) {
    this.code = props.code;
    this.score = RiskScore.create(props.score);
    this.message = props.message;
    this.evidence = Object.freeze({ ...(props.evidence ?? {}) });
  }

  static create(props: RiskSignalProps): RiskSignal {
    if (!props.code.trim()) {
      throw new Error('Risk signal code must not be empty');
    }
    if (!props.message.trim()) {
      throw new Error('Risk signal message must not be empty');
    }
    return new RiskSignal(props);
  }
}
