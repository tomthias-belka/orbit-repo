/**
 * Batch Processing Utilities
 * Efficiently process large arrays in batches to avoid blocking
 */

export interface BatchProcessorOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  parallel?: boolean;
}

/**
 * Process an array in batches with optional delays
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  options: BatchProcessorOptions = {}
): Promise<R[]> {
  const {
    batchSize = 50,
    delayBetweenBatches = 0,
    parallel = false
  } = options;

  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);

    if (parallel) {
      // Process batch items in parallel
      const batchResults = await Promise.all(
        batch.map((item, localIndex) => processor(item, start + localIndex))
      );
      results.push(...batchResults);
    } else {
      // Process batch items sequentially
      for (let i = 0; i < batch.length; i++) {
        const result = await processor(batch[i], start + i);
        results.push(result);
      }
    }

    // Optional delay between batches to prevent UI blocking
    if (delayBetweenBatches > 0 && batchIndex < totalBatches - 1) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
}

/**
 * Process an array in batches and call a callback with progress
 */
export async function processBatchWithProgress<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  onProgress: (processed: number, total: number, percentage: number) => void,
  options: BatchProcessorOptions = {}
): Promise<R[]> {
  const {
    batchSize = 50,
    delayBetweenBatches = 0,
    parallel = false
  } = options;

  const results: R[] = [];
  const total = items.length;
  const totalBatches = Math.ceil(total / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, total);
    const batch = items.slice(start, end);

    if (parallel) {
      const batchResults = await Promise.all(
        batch.map((item, localIndex) => processor(item, start + localIndex))
      );
      results.push(...batchResults);
    } else {
      for (let i = 0; i < batch.length; i++) {
        const result = await processor(batch[i], start + i);
        results.push(result);
      }
    }

    // Report progress
    const processed = end;
    const percentage = Math.round((processed / total) * 100);
    onProgress(processed, total, percentage);

    // Optional delay between batches
    if (delayBetweenBatches > 0 && batchIndex < totalBatches - 1) {
      await sleep(delayBetweenBatches);
    }
  }

  return results;
}

/**
 * Split an array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process multiple arrays in parallel batches
 */
export async function processMultipleBatches<T, R>(
  batches: T[][],
  processor: (items: T[]) => Promise<R>
): Promise<R[]> {
  return Promise.all(batches.map(batch => processor(batch)));
}

/**
 * Debounced batch processor - collects items and processes them in batches
 */
export class DebouncedBatchProcessor<T, R> {
  private queue: T[] = [];
  private timer: number | null = null;
  private processor: (items: T[]) => Promise<R[]>;
  private delay: number;
  private maxBatchSize: number;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    delay: number = 100,
    maxBatchSize: number = 50
  ) {
    this.processor = processor;
    this.delay = delay;
    this.maxBatchSize = maxBatchSize;
  }

  add(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay) as unknown as number;
  }

  async flush(): Promise<R[] | null> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return null;
    }

    const items = [...this.queue];
    this.queue = [];

    return this.processor(items);
  }
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;
  private minInterval: number;
  private lastExecution = 0;

  constructor(maxConcurrent: number = 5, minInterval: number = 50) {
    this.maxConcurrent = maxConcurrent;
    this.minInterval = minInterval;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum interval between executions
          const now = Date.now();
          const timeSinceLastExecution = now - this.lastExecution;
          if (timeSinceLastExecution < this.minInterval) {
            await sleep(this.minInterval - timeSinceLastExecution);
          }

          const result = await fn();
          this.lastExecution = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        this.running++;
        fn();
      }
    }
  }
}
