import { z } from 'zod';

export class DatasetValidationError extends Error {
  constructor(
    readonly fileName: string,
    readonly rowNumber: number,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(
      `Invalid row ${rowNumber} in ${fileName}: ${issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    );
    this.name = DatasetValidationError.name;
  }
}
