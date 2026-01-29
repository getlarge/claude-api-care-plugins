/**
 * Worker Pool for CPU-intensive MCP tool operations.
 *
 * Offloads spec review and fix operations to worker threads
 * to avoid blocking the main event loop on the HTTP server.
 *
 * For STDIO transport, workers are optional (single client).
 * For HTTP transport, workers prevent one client's review from
 * blocking other clients.
 */

import { Worker } from 'node:worker_threads';
// Side-effect import: ensures tsx watch tracks worker.ts changes
import './worker.js';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEFAULT_TIMEOUTS } from '../utils/timeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WorkerTask<T = unknown> {
  type: 'review' | 'apply-fixes';
  payload: T;
  /** SharedArrayBuffer containing raw spec data */
  specBuffer: SharedArrayBuffer;
  /** Content type for parsing (json or yaml) */
  contentType: 'json' | 'yaml';
  /** Source path for error messages */
  sourcePath: string;
}

export interface WorkerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface QueuedTask {
  task: WorkerTask;
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
}

/**
 * Simple worker pool that manages a fixed number of workers.
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: QueuedTask[] = [];
  private workerPath: string;

  constructor(
    private poolSize: number = Math.max(1, availableParallelism() - 1),
    workerPath?: string
  ) {
    // Use .ts extension when running with tsx (dev/test), .js for production builds
    const isTsx = __filename.endsWith('.ts');
    const workerFile = isTsx ? 'worker.ts' : 'worker.js';
    this.workerPath = workerPath ?? join(__dirname, workerFile);
  }

  /**
   * Initialize the worker pool.
   */
  async initialize(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerPath);
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Execute a task in a worker thread.
   */
  async execute<T>(task: WorkerTask<T>): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask = { task, resolve, reject };

      const worker = this.availableWorkers.pop();
      if (worker) {
        this.runTask(worker, queuedTask);
      } else {
        // All workers busy, queue the task
        this.taskQueue.push(queuedTask);
      }
    });
  }

  private runTask(
    worker: Worker,
    queuedTask: QueuedTask,
    timeoutMs = DEFAULT_TIMEOUTS.worker
  ): void {
    const { task, resolve, reject } = queuedTask;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      worker.off('message', onMessage);
      worker.off('error', onError);
      // Return worker to pool
      this.availableWorkers.push(worker);
      // Process next queued task if any
      const next = this.taskQueue.shift();
      if (next) {
        const nextWorker = this.availableWorkers.pop();
        if (nextWorker) {
          this.runTask(nextWorker, next, timeoutMs);
        }
      }
    };

    const onMessage = (result: WorkerResult) => {
      cleanup();
      resolve(result);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error(`Worker task timed out after ${timeoutMs}ms`));
    };

    timeoutId = setTimeout(onTimeout, timeoutMs);
    worker.once('message', onMessage);
    worker.once('error', onError);
    worker.postMessage(task);
  }

  /**
   * Gracefully shutdown all workers.
   */
  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }

  /**
   * Get pool statistics.
   */
  get stats() {
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      busy: this.workers.length - this.availableWorkers.length,
      queued: this.taskQueue.length,
    };
  }
}
