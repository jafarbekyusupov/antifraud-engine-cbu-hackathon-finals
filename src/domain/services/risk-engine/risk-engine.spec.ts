import { Transaction } from '../../entities';
import { GeoPoint } from '../../value-objects';
import { RiskContext } from './risk-context';
import { RiskEngine } from './risk-engine';

const at = (minute: number): Date =>
  new Date(`2026-03-01T07:${String(minute).padStart(2, '0')}:00+05:00`);

function transaction(
  overrides: Partial<Parameters<typeof Transaction.create>[0]> = {},
): Transaction {
  return Transaction.create({
    id: 'T00000001',
    cardId: 'K000001',
    clientId: 'C00001',
    occurredAt: at(10),
    amount: 100_000,
    currency: 'UZS',
    merchantId: 'M00001',
    mcc: '5411',
    city: 'Toshkent',
    location: GeoPoint.create(41.2995, 69.2401),
    channel: 'POS',
    response: 'OK',
    ...overrides,
  });
}

function context(overrides: Partial<RiskContext> = {}): RiskContext {
  return {
    client: {
      monthlyIncome: 5_000_000,
      openedAt: new Date('2020-01-01T00:00:00Z'),
      segment: 'STANDARD',
      homeCity: 'Toshkent',
    },
    card: { dailyLimit: 20_000_000, openedAt: new Date('2020-01-02'), type: 'UZCARD' },
    merchant: { category: 'Oziq-ovqat', city: 'Toshkent', riskLevel: 'LOW' },
    baseline: {
      sampleCount: 100,
      amountMean: 150_000,
      amountStandardDeviation: 50_000,
      amountMedian: 140_000,
      amountQ1: 100_000,
      amountQ3: 200_000,
      frequentCities: { Toshkent: 80 },
      frequentMccs: { '5411': 50 },
    },
    recentCardTransactions: [],
    lastPhysicalTransaction: null,
    ...overrides,
  };
}

describe('RiskEngine', () => {
  it('approves ordinary behavior', () => {
    const assessment = RiskEngine.createDefault().assess(transaction(), context());
    expect(assessment).toMatchObject({ riskScore: 0, action: 'APPROVE', ruleVersion: 'v1' });
  });

  it('blocks impossible physical travel', () => {
    const previous = transaction({ occurredAt: at(0), city: 'Toshkent' });
    const current = transaction({
      id: 'T00000002',
      occurredAt: at(10),
      city: 'Dubay',
      location: GeoPoint.create(25.2048, 55.2708),
    });
    const assessment = RiskEngine.createDefault().assess(
      current,
      context({ lastPhysicalTransaction: previous }),
    );

    expect(assessment.action).toBe('BLOCK');
    expect(assessment.signals[0]?.code).toBe('IMPOSSIBLE_TRAVEL');
  });

  it('does not flag a documented split-bill pattern', () => {
    const recent = Array.from({ length: 6 }, (_, index) =>
      transaction({ id: `T0000000${index + 1}`, occurredAt: at(index + 1), amount: 50_000 }),
    );
    const assessment = RiskEngine.createDefault().assess(
      transaction({ id: 'T00000009', occurredAt: at(9), amount: 50_000 }),
      context({ recentCardTransactions: recent }),
    );

    expect(assessment.signals.find((signal) => signal.code === 'VELOCITY')).toBeUndefined();
  });
});
