import { batchAsync } from './batch-async';

async function* numbers(): AsyncGenerator<number> {
  for (let value = 1; value <= 5; value += 1) {
    yield await Promise.resolve(value);
  }
}

describe('batchAsync', () => {
  it('keeps only a bounded chunk and emits the remainder', async () => {
    const batches: number[][] = [];
    for await (const batch of batchAsync(numbers(), 2)) {
      batches.push([...batch]);
    }
    expect(batches).toEqual([[1, 2], [3, 4], [5]]);
  });
});
