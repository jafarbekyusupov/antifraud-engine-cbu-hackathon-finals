import { z } from 'zod';

export const caseParamsSchema = z.strictObject({ id: z.uuid() });

export const openCaseBodySchema = z.strictObject({
  note: z.string().trim().min(1).max(2_000).optional(),
});

export const updateCaseBodySchema = z
  .strictObject({
    status: z.enum(['OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED']).optional(),
    note: z.string().trim().min(1).max(2_000).optional(),
  })
  .refine((body) => body.status !== undefined || body.note !== undefined, {
    message: 'At least one of status or note is required',
  });

export type CaseParamsDto = z.infer<typeof caseParamsSchema>;
export type OpenCaseBodyDto = z.infer<typeof openCaseBodySchema>;
export type UpdateCaseBodyDto = z.infer<typeof updateCaseBodySchema>;
