import { z } from 'zod';
import { sourceIdSchema } from '../../../common/source-id.schema';

export const scoreTransactionSchema = z.strictObject({
  transactionId: sourceIdSchema,
  cardId: sourceIdSchema,
  clientId: sourceIdSchema,
  occurredAt: z.iso.datetime({ offset: true }),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.string().length(3).toUpperCase(),
  merchantId: sourceIdSchema,
  mcc: z.string().regex(/^\d{4}$/),
  city: z.string().trim().min(1).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  channel: z.enum(['ATM', 'ECOM', 'P2P', 'POS']),
  response: z.enum(['OK', 'DECLINED']),
});

export type ScoreTransactionDto = z.infer<typeof scoreTransactionSchema>;
