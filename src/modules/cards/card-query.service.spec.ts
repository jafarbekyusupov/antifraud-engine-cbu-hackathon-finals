import { CardQueryRepository } from '../../application/ports/card-query.repository';
import { CardQueryService } from './card-query.service';

describe('CardQueryService', () => {
  const customerCards = [
    {
      cardId: 'K000001',
      type: 'UZCARD' as const,
      currency: 'UZS',
      openedAt: new Date('2025-01-01T00:00:00Z'),
      dailyLimit: 10_000_000,
    },
    {
      cardId: 'K000002',
      type: 'HUMO' as const,
      currency: 'UZS',
      openedAt: new Date('2025-01-02T00:00:00Z'),
      dailyLimit: 20_000_000,
    },
  ];

  it('scopes customer card queries to the authenticated client and paginates', async () => {
    const listCustomer = jest.fn().mockResolvedValue(customerCards);
    const repository: CardQueryRepository = {
      listOperator: jest.fn(),
      listCustomer,
    };
    const service = new CardQueryService(repository);

    await expect(service.listCustomer('C00001', { limit: 1 })).resolves.toEqual({
      items: [customerCards[0]],
      nextCursor: 'K000001',
    });
    expect(listCustomer).toHaveBeenCalledWith('C00001', { limit: 2 });
  });
});
