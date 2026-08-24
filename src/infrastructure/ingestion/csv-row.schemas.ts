import { z } from 'zod';
import { sourceIdSchema } from '../../common/source-id.schema';
import {
  CardImportRecord,
  ClientImportRecord,
  MerchantImportRecord,
} from '../../application/ports/dataset-reader.port';
import { Transaction } from '../../domain/entities';
import { GeoPoint } from '../../domain/value-objects';

const positiveIntegerString = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());
const finiteNumberString = z.string().transform(Number).pipe(z.number().finite());
const dateString = z.iso.date().transform((value) => new Date(`${value}T00:00:00+05:00`));
const timestampString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  .transform((value) => new Date(`${value.replace(' ', 'T')}+05:00`));

const segmentMapping = {
  standart: 'STANDARD',
  yosh: 'YOUNG',
  premium: 'PREMIUM',
} as const;

const merchantRiskMapping = {
  past: 'LOW',
  orta: 'MEDIUM',
  yuqori: 'HIGH',
} as const;

export const clientCsvRowSchema: z.ZodType<ClientImportRecord> = z
  .strictObject({
    client_id: sourceIdSchema,
    ism: z.string().trim().min(1).max(100),
    jins: z.enum(['M', 'F']),
    tugilgan_yil: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number),
    viloyat: z.string().trim().min(1).max(50),
    uy_shahri: z.string().trim().min(1).max(50),
    ochilgan_sana: dateString,
    oylik_daromad: positiveIntegerString,
    segment: z.enum(['standart', 'yosh', 'premium']),
  })
  .transform((row) => ({
    id: row.client_id,
    fullName: row.ism,
    gender: row.jins,
    birthYear: row.tugilgan_yil,
    region: row.viloyat,
    homeCity: row.uy_shahri,
    openedAt: row.ochilgan_sana,
    monthlyIncome: row.oylik_daromad,
    segment: segmentMapping[row.segment],
  }));

export const cardCsvRowSchema: z.ZodType<CardImportRecord> = z
  .strictObject({
    card_id: sourceIdSchema,
    client_id: sourceIdSchema,
    turi: z.enum(['UZCARD', 'HUMO', 'VISA', 'MASTERCARD']),
    valyuta: z.string().length(3).toUpperCase(),
    ochilgan_sana: dateString,
    kunlik_limit: positiveIntegerString,
  })
  .transform((row) => ({
    id: row.card_id,
    clientId: row.client_id,
    type: row.turi,
    currency: row.valyuta,
    openedAt: row.ochilgan_sana,
    dailyLimit: row.kunlik_limit,
  }));

export const merchantCsvRowSchema: z.ZodType<MerchantImportRecord> = z
  .strictObject({
    merchant_id: sourceIdSchema,
    nomi: z.string().trim().min(1).max(100),
    mcc: z.string().regex(/^\d{4}$/),
    kategoriya: z.string().trim().min(1).max(50),
    shahar: z.string().trim().min(1).max(50),
    xavf_darajasi: z.enum(['past', 'orta', 'yuqori']),
  })
  .transform((row) => ({
    id: row.merchant_id,
    name: row.nomi,
    mcc: row.mcc,
    category: row.kategoriya,
    city: row.shahar,
    riskLevel: merchantRiskMapping[row.xavf_darajasi],
  }));

export const transactionCsvRowSchema: z.ZodType<Transaction> = z
  .strictObject({
    tx_id: sourceIdSchema,
    card_id: sourceIdSchema,
    client_id: sourceIdSchema,
    vaqt: timestampString,
    summa: positiveIntegerString,
    valyuta: z.string().length(3).toUpperCase(),
    merchant_id: sourceIdSchema,
    mcc: z.string().regex(/^\d{4}$/),
    shahar: z.string().trim().min(1).max(50),
    lat: finiteNumberString.pipe(z.number().min(-90).max(90)),
    lon: finiteNumberString.pipe(z.number().min(-180).max(180)),
    kanal: z.enum(['ATM', 'ECOM', 'P2P', 'POS']),
    javob: z.enum(['OK', 'DECLINED']),
  })
  .transform((row) =>
    Transaction.create({
      id: row.tx_id,
      cardId: row.card_id,
      clientId: row.client_id,
      occurredAt: row.vaqt,
      amount: row.summa,
      currency: row.valyuta,
      merchantId: row.merchant_id,
      mcc: row.mcc,
      city: row.shahar,
      location: GeoPoint.create(row.lat, row.lon),
      channel: row.kanal,
      response: row.javob,
    }),
  );
