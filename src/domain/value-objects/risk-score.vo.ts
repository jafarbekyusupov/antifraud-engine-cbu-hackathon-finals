export class RiskScore {
  private constructor(readonly value: number) {}

  static create(value: number): RiskScore {
    if (!Number.isFinite(value)) {
      throw new TypeError('Risk score must be a finite number');
    }
    return new RiskScore(Math.max(0, Math.min(100, Math.round(value))));
  }
}
