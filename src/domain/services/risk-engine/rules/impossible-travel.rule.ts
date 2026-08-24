import { Transaction } from '../../../entities';
import { RiskSignal } from '../../../value-objects';
import { RiskContext } from '../risk-context';
import { RiskRule } from '../risk-rule';

export class ImpossibleTravelRule implements RiskRule {
  readonly code = 'IMPOSSIBLE_TRAVEL';

  evaluate(transaction: Transaction, context: RiskContext): RiskSignal | null {
    if (!transaction.isPhysical() || !context.lastPhysicalTransaction) {
      return null;
    }

    const previous = context.lastPhysicalTransaction;
    const elapsedHours =
      (transaction.occurredAt.getTime() - previous.occurredAt.getTime()) / (60 * 60 * 1_000);
    if (elapsedHours <= 0) {
      return null;
    }

    const distanceKm = previous.location.distanceTo(transaction.location);
    if (distanceKm < 100) {
      return null;
    }

    const requiredSpeedKmh = distanceKm / elapsedHours;
    if (requiredSpeedKmh < 500) {
      return null;
    }

    const score = requiredSpeedKmh >= 900 ? 85 : 60;
    return RiskSignal.create({
      code: this.code,
      score,
      message: `${Math.round(distanceKm)} km of travel would require ${Math.round(requiredSpeedKmh)} km/h`,
      evidence: {
        previousTransactionId: previous.id,
        previousCity: previous.city,
        currentCity: transaction.city,
        distanceKm: Number(distanceKm.toFixed(2)),
        elapsedMinutes: Number((elapsedHours * 60).toFixed(2)),
        requiredSpeedKmh: Number(requiredSpeedKmh.toFixed(2)),
      },
    });
  }
}
