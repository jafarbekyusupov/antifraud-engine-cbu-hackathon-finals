import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse';
import { z } from 'zod';
import {
  CardImportRecord,
  ClientImportRecord,
  DatasetReader,
  MerchantImportRecord,
} from '../../application/ports/dataset-reader.port';
import { Transaction } from '../../domain/entities';
import {
  cardCsvRowSchema,
  clientCsvRowSchema,
  merchantCsvRowSchema,
  transactionCsvRowSchema,
} from './csv-row.schemas';
import { DatasetValidationError } from './dataset-validation.error';

export class CsvDatasetReader implements DatasetReader {
  constructor(private readonly dataDirectory: string) {}

  clients(): AsyncIterable<ClientImportRecord> {
    return this.read('clients.csv', clientCsvRowSchema);
  }

  cards(): AsyncIterable<CardImportRecord> {
    return this.read('cards.csv', cardCsvRowSchema);
  }

  merchants(): AsyncIterable<MerchantImportRecord> {
    return this.read('merchants.csv', merchantCsvRowSchema);
  }

  transactions(): AsyncIterable<Transaction> {
    return this.read('transactions.csv', transactionCsvRowSchema);
  }

  private async *read<TSchema extends z.ZodType>(
    fileName: string,
    schema: TSchema,
  ): AsyncGenerator<z.output<TSchema>> {
    const parser = createReadStream(join(this.dataDirectory, fileName)).pipe(
      parse({
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }),
    );

    let rowNumber = 1;
    for await (const value of parser) {
      rowNumber += 1;
      const result = schema.safeParse(value);
      if (!result.success) {
        throw new DatasetValidationError(fileName, rowNumber, result.error.issues);
      }
      yield result.data;
    }
  }
}
