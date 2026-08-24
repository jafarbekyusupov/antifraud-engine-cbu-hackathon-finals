import { Inject, Injectable } from '@nestjs/common';
import { batchAsync } from '../common/batch-async';
import {
  DATASET_IMPORT_REPOSITORY,
  DatasetImportRepository,
} from '../ports/dataset-import.repository';
import { DATASET_READER, DatasetReader } from '../ports/dataset-reader.port';

export interface ImportDatasetResult {
  clients: number;
  cards: number;
  merchants: number;
  transactions: number;
}

@Injectable()
export class ImportDatasetUseCase {
  private readonly batchSize = 500;

  constructor(
    @Inject(DATASET_READER) private readonly reader: DatasetReader,
    @Inject(DATASET_IMPORT_REPOSITORY) private readonly repository: DatasetImportRepository,
  ) {}

  async execute(): Promise<ImportDatasetResult> {
    const clients = await this.importBatches(this.reader.clients(), (batch) =>
      this.repository.upsertClients(batch),
    );
    const cards = await this.importBatches(this.reader.cards(), (batch) =>
      this.repository.upsertCards(batch),
    );
    const merchants = await this.importBatches(this.reader.merchants(), (batch) =>
      this.repository.upsertMerchants(batch),
    );
    const transactions = await this.importBatches(this.reader.transactions(), (batch) =>
      this.repository.insertTransactions(batch),
    );

    return { clients, cards, merchants, transactions };
  }

  private async importBatches<T>(
    source: AsyncIterable<T>,
    write: (batch: readonly T[]) => Promise<void>,
  ): Promise<number> {
    let imported = 0;
    for await (const batch of batchAsync(source, this.batchSize)) {
      await write(batch);
      imported += batch.length;
    }
    return imported;
  }
}
