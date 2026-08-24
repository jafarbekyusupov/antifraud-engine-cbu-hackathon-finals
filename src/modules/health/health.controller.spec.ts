import { Test } from '@nestjs/testing';
import { DATABASE_POOL } from '../../database/database.tokens';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports a healthy database connection', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }) };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DATABASE_POOL, useValue: pool }],
    }).compile();

    await expect(module.get(HealthController).check()).resolves.toMatchObject({
      status: 'ok',
      info: { postgres: { status: 'up' } },
    });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
