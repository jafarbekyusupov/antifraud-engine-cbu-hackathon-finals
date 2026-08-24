import { evaluateDeviceContext } from './customer-verification';

describe('evaluateDeviceContext', () => {
  it('accepts coherent location, timezone, and device time', () => {
    const receivedAt = new Date('2026-03-01T02:02:14.000Z');
    const checks = evaluateDeviceContext({
      transactionLatitude: 39.654,
      transactionLongitude: 66.959,
      deviceLatitude: 39.655,
      deviceLongitude: 66.958,
      accuracyMeters: 18,
      timezoneName: 'Asia/Tashkent',
      utcOffsetMinutes: 300,
      deviceTimestamp: new Date('2026-03-01T02:02:10.000Z'),
      receivedAt,
    });

    expect(checks.locationMatch).toBe(true);
    expect(checks.timezoneMatch).toBe(true);
    expect(checks.clockMatch).toBe(true);
  });

  it('rejects a timezone offset that does not match its IANA zone', () => {
    const at = new Date('2026-03-01T02:02:10.000Z');
    const checks = evaluateDeviceContext({
      transactionLatitude: 39.654,
      transactionLongitude: 66.959,
      deviceLatitude: 39.655,
      deviceLongitude: 66.958,
      accuracyMeters: 18,
      timezoneName: 'Asia/Tashkent',
      utcOffsetMinutes: 0,
      deviceTimestamp: at,
      receivedAt: at,
    });

    expect(checks.timezoneMatch).toBe(false);
  });
});
