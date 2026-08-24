import { Transaction } from '../../domain/entities';
import { CardImportRecord, ClientImportRecord, MerchantImportRecord } from './dataset-reader.port';

export interface DatasetImportRepository {
  upsertClients(records: readonly ClientImportRecord[]): Promise<void>;
  upsertCards(records: readonly CardImportRecord[]): Promise<void>;
  upsertMerchants(records: readonly MerchantImportRecord[]): Promise<void>;
  insertTransactions(records: readonly Transaction[]): Promise<void>;
}

export const DATASET_IMPORT_REPOSITORY = Symbol('DATASET_IMPORT_REPOSITORY');
