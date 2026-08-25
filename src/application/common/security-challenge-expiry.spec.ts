import { securityChallengeExpiresAt } from './security-challenge-expiry';

describe('securityChallengeExpiresAt', () => {
  const now = new Date('2026-08-25T10:00:00.000Z');

  it('adds the configured TTL', () => {
    expect(securityChallengeExpiresAt(300, now).toISOString()).toBe(
      '2026-08-25T10:05:00.000Z',
    );
  });

  it('uses a far-future date when expiration is disabled', () => {
    expect(securityChallengeExpiresAt(0, now).getUTCFullYear()).toBe(9999);
  });
});
