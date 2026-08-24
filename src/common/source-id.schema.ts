import { z } from 'zod';

export const SOURCE_ID_MAX_LENGTH = 100;

/** External dataset identifiers are opaque values; their prefixes and shape are not domain rules. */
export const sourceIdSchema = z.string().trim().min(1).max(SOURCE_ID_MAX_LENGTH);
