import { GeoPoint } from '../value-objects';

export interface DeviceVerificationChecks {
  locationMatch: boolean;
  timezoneMatch: boolean;
  clockMatch: boolean;
  clockSkewSeconds: number;
  distanceKm: number;
}

export interface DeviceVerificationContext {
  transactionLatitude: number;
  transactionLongitude: number;
  deviceLatitude: number;
  deviceLongitude: number;
  accuracyMeters: number;
  timezoneName: string;
  utcOffsetMinutes: number;
  deviceTimestamp: Date;
  receivedAt: Date;
}

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const MAX_USABLE_ACCURACY_METERS = 1_000;
const BASE_LOCATION_RADIUS_KM = 5;

export function evaluateDeviceContext(context: DeviceVerificationContext): DeviceVerificationChecks {
  const transactionLocation = GeoPoint.create(
    context.transactionLatitude,
    context.transactionLongitude,
  );
  const deviceLocation = GeoPoint.create(context.deviceLatitude, context.deviceLongitude);
  const distanceKm = transactionLocation.distanceTo(deviceLocation);
  const acceptedRadiusKm = BASE_LOCATION_RADIUS_KM + context.accuracyMeters / 1_000;
  const locationMatch =
    context.accuracyMeters <= MAX_USABLE_ACCURACY_METERS && distanceKm <= acceptedRadiusKm;

  const expectedOffset = timezoneOffsetMinutes(context.timezoneName, context.deviceTimestamp);
  const timezoneMatch =
    expectedOffset !== null && Math.abs(expectedOffset - context.utcOffsetMinutes) <= 1;
  const clockSkewSeconds = Math.round(
    Math.abs(context.receivedAt.getTime() - context.deviceTimestamp.getTime()) / 1_000,
  );

  return {
    locationMatch,
    timezoneMatch,
    clockMatch: clockSkewSeconds <= MAX_CLOCK_SKEW_SECONDS,
    clockSkewSeconds,
    distanceKm: Number(distanceKm.toFixed(2)),
  };
}

function timezoneOffsetMinutes(timezoneName: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const asUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    return Math.round((asUtc - at.getTime()) / 60_000);
  } catch {
    return null;
  }
}
