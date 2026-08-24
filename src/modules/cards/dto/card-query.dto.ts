import { z } from 'zod';
import { sourceIdSchema } from '../../../common/source-id.schema';

const pageFields = {
  cursor: sourceIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
};

export const operatorCardQuerySchema = z.strictObject({
  clientId: sourceIdSchema.optional(),
  ...pageFields,
});

export const customerCardQuerySchema = z.strictObject(pageFields);

export type OperatorCardQueryDto = z.infer<typeof operatorCardQuerySchema>;
export type CustomerCardQueryDto = z.infer<typeof customerCardQuerySchema>;
