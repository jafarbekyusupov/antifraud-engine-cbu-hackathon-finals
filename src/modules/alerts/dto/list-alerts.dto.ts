import { z } from 'zod';

export const listAlertsQuerySchema = z.strictObject({
  status: z.enum(['OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED']).optional(),
  clientId: z
    .string()
    .regex(/^C\d{5}$/)
    .optional(),
  minimumRiskScore: z.coerce.number().int().min(0).max(100).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type ListAlertsQueryDto = z.infer<typeof listAlertsQuerySchema>;
