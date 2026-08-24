import { z } from 'zod';
import { sourceIdSchema } from '../../../common/source-id.schema';

export const operatorTransactionQuerySchema = z.strictObject({
  clientId: sourceIdSchema.optional(),
  cardId: sourceIdSchema.optional(),
  merchantId: sourceIdSchema.optional(),
  channel: z.enum(['ATM', 'ECOM', 'P2P', 'POS']).optional(),
  response: z.enum(['OK', 'DECLINED']).optional(),
  action: z.enum(['APPROVE', 'STEP_UP', 'BLOCK']).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  minimumAmount: z.coerce.number().int().positive().optional(),
  maximumAmount: z.coerce.number().int().positive().optional(),
  minimumRiskScore: z.coerce.number().int().min(0).max(100).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const customerTransactionQuerySchema = z.strictObject({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const transactionParamsSchema = z.strictObject({
  id: sourceIdSchema,
});

export type OperatorTransactionQueryDto = z.infer<typeof operatorTransactionQuerySchema>;
export type CustomerTransactionQueryDto = z.infer<typeof customerTransactionQuerySchema>;
export type TransactionParamsDto = z.infer<typeof transactionParamsSchema>;
