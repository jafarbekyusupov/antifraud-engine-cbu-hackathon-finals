import { z } from 'zod';

export const authenticatedClientIdSchema = z.string().regex(/^C\d{5}$/);
export const idempotencyKeySchema = z.string().trim().min(8).max(100);
export const securityChallengeParamsSchema = z.strictObject({ id: z.uuid() });

export const respondToSecurityChallengeSchema = z.strictObject({
  decision: z.enum(['CONFIRM', 'DENY']),
  deviceTimestamp: z.iso.datetime({ offset: true }),
  location: z.strictObject({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracyMeters: z.number().positive().max(50_000),
  }),
  timezone: z.strictObject({
    name: z.string().trim().min(1).max(100),
    utcOffsetMinutes: z.number().int().min(-840).max(840),
  }),
});

export type SecurityChallengeParamsDto = z.infer<typeof securityChallengeParamsSchema>;
export type RespondToSecurityChallengeDto = z.infer<typeof respondToSecurityChallengeSchema>;
