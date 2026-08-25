const NO_EXPIRY_DATE = new Date('9999-12-31T23:59:59.999Z');

export function securityChallengeExpiresAt(ttlSeconds: number, now = new Date()): Date {
  if (ttlSeconds === 0) return new Date(NO_EXPIRY_DATE);
  return new Date(now.getTime() + ttlSeconds * 1_000);
}
