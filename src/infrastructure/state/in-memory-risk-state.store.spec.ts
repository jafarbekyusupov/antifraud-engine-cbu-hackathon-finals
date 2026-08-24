import { ReplayTransaction } from '../../application/ports/transaction-replay.repository';
import { Transaction } from '../../domain/entities';
import { GeoPoint } from '../../domain/value-objects';
import { InMemoryRiskStateStore } from './in-memory-risk-state.store';

function item(sequence: number, minute: number, amount = 100_000): ReplayTransaction {
  return {
    transaction: Transaction.create({
      id: `T${String(sequence).padStart(8, '0')}`,
      cardId: 'K000001',
      clientId: 'C00001',
      occurredAt: new Date(Date.UTC(2026, 2, 1, 2, minute)),
      amount,
      currency: 'UZS',
      merchantId: 'M00001',
      mcc: '5411',
      city: 'Toshkent',
      location: GeoPoint.create(41.2995, 69.2401),
      channel: 'POS',
      response: 'OK',
    }),
    client: {
      monthlyIncome: 5_000_000,
      openedAt: new Date('2020-01-01T00:00:00Z'),
      segment: 'STANDARD',
      homeCity: 'Toshkent',
    },
    card: { dailyLimit: 20_000_000, openedAt: new Date('2020-01-02'), type: 'UZCARD' },
    merchant: { category: 'Oziq-ovqat', city: 'Toshkent', riskLevel: 'LOW' },
  };
}

describe('InMemoryRiskStateStore', () => {
  it('prunes card history outside the 15-minute window', () => {
    const store = new InMemoryRiskStateStore();
    store.record(item(1, 0).transaction);
    store.record(item(2, 16).transaction);

    const context = store.contextFor(item(3, 17));
    expect(context.recentCardTransactions.map((transaction) => transaction.id)).toEqual([
      'T00000002',
    ]);
  });

  it('keeps lifetime streaming statistics while quantiles use a bounded sample', () => {
    const store = new InMemoryRiskStateStore();
    for (let sequence = 1; sequence <= 300; sequence += 1) {
      store.record(item(sequence, sequence, sequence * 1_000).transaction);
    }

    const baseline = store.contextFor(item(301, 301)).baseline;
    expect(baseline.sampleCount).toBe(300);
    expect(baseline.amountMean).toBeCloseTo(150_500);
    expect(baseline.amountMedian).not.toBeNull();
  });
});
