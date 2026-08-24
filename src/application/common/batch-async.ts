export async function* batchAsync<T>(
  source: AsyncIterable<T>,
  batchSize: number,
): AsyncGenerator<readonly T[]> {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new RangeError('Batch size must be a positive integer');
  }

  let batch: T[] = [];
  for await (const item of source) {
    batch.push(item);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}
