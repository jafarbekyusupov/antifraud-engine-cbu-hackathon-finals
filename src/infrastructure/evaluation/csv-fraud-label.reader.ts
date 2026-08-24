import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse';
import { z } from 'zod';
import { FraudLabel, FraudLabelReader } from '../../application/ports/fraud-evaluation.repository';

const fraudLabelRowSchema = z.strictObject({
  tx_id: z.string().trim().min(1),
  client_id: z.string().trim().min(1),
  firibgarlik: z.enum(['0', '1']),
  naqsh: z.string().trim().min(1),
});

export class CsvFraudLabelReader implements FraudLabelReader {
  constructor(private readonly dataDirectory: string) {}

  async *readPositiveLabels(): AsyncGenerator<FraudLabel> {
    const filePath = join(this.dataDirectory, '_javob_kaliti', 'fraud_labels.csv');
    const parser = createReadStream(filePath).pipe(
      parse({ bom: true, columns: true, skip_empty_lines: true, trim: true }),
    );

    let rowNumber = 1;
    for await (const value of parser) {
      rowNumber += 1;
      const result = fraudLabelRowSchema.safeParse(value);
      if (!result.success) {
        throw new Error(
          `Invalid fraud label row ${rowNumber}: ${result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ')}`,
        );
      }
      if (result.data.firibgarlik === '1') {
        yield { transactionId: result.data.tx_id, pattern: result.data.naqsh };
      }
    }
  }
}
