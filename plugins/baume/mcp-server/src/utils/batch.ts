/**
 * Batch Processing Utilities
 *
 * Generic helpers for batched async operations with concurrency control.
 */

/**
 * Process items in batches with controlled concurrency.
 *
 * @param items - Items to process
 * @param batchSize - Maximum concurrent operations per batch
 * @param processor - Async function to process each item
 * @param onBatchStart - Optional callback before each batch starts
 * @returns Array of results in same order as input items
 */
export async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>,
  onBatchStart?: (batchIndex: number, batchItems: T[]) => void
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    onBatchStart?.(batchIndex, batch);

    const batchResults = await Promise.all(
      batch.map((item, j) => processor(item, i + j))
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Process items in batches, flattening results.
 *
 * @param items - Items to process
 * @param batchSize - Maximum concurrent operations per batch
 * @param processor - Async function returning arrays to flatten
 * @param onBatchStart - Optional callback before each batch starts
 * @returns Flattened array of all results
 */
export async function processBatchedFlat<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R[]>,
  onBatchStart?: (batchIndex: number, batchItems: T[]) => void
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    onBatchStart?.(batchIndex, batch);

    const batchResults = await Promise.all(
      batch.map((item, j) => processor(item, i + j))
    );

    for (const arr of batchResults) {
      results.push(...arr);
    }
  }

  return results;
}

/**
 * Map entries with batched processing.
 *
 * @param entries - Map entries to process
 * @param batchSize - Maximum concurrent operations per batch
 * @param processor - Async function to process each entry
 * @param onBatchStart - Optional callback before each batch starts
 * @returns Flattened array of all results
 */
export async function processMapBatched<K, V, R>(
  entries: Iterable<[K, V]>,
  batchSize: number,
  processor: (key: K, value: V) => Promise<R[]>,
  onBatchStart?: (batchIndex: number, batchSize: number, total: number) => void
): Promise<R[]> {
  const entriesArray = Array.from(entries);
  const results: R[] = [];

  for (let i = 0; i < entriesArray.length; i += batchSize) {
    const batch = entriesArray.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    onBatchStart?.(batchIndex, batch.length, entriesArray.length);

    const batchResults = await Promise.all(
      batch.map(([key, value]) => processor(key, value))
    );

    for (const arr of batchResults) {
      results.push(...arr);
    }
  }

  return results;
}
