import { customerTransactionQuerySchema } from './transaction-query.dto';

describe('customerTransactionQuerySchema', () => {
  it('accepts cardId as a customer transaction filter', () => {
    expect(customerTransactionQuerySchema.parse({ cardId: 'K000001' })).toEqual({
      cardId: 'K000001',
      limit: 25,
    });
  });

  it('does not allow a customer to override the header-derived clientId', () => {
    expect(() => customerTransactionQuerySchema.parse({ clientId: 'C99999' })).toThrow();
  });
});
