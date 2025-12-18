/**
 * Store Module
 *
 * Exports storage implementations and factory for creating stores.
 */

export { BaseStore } from './base.js';
export type {
  StoredSpec,
  StoreOptions,
  StoreResult,
  StoreStats,
} from './base.js';

export { MemoryStore } from './memory.js';
export type { MemoryStoreOptions } from './memory.js';
export { SqliteStore } from './sqlite.js';
export type { SqliteStoreOptions } from './sqlite.js';
export type { FileBackend } from './file-backend.js';
export { LocalFileBackend } from './file-backend.js';

import { BaseStore } from './base.js';
import type { StoreOptions } from './base.js';
import { MemoryStore } from './memory.js';
import type { MemoryStoreOptions } from './memory.js';
import { SqliteStore } from './sqlite.js';
import type { SqliteStoreOptions } from './sqlite.js';

export type StoreType = 'memory' | 'sqlite';

export type CreateStoreOptions = StoreOptions & {
  type?: StoreType;
  memory?: Omit<MemoryStoreOptions, keyof StoreOptions>;
  sqlite?: Omit<SqliteStoreOptions, keyof StoreOptions>;
};

/**
 * Create a store based on configuration.
 *
 * @param options.type - 'memory' for STDIO/tests, 'sqlite' for HTTP/production
 * @param options.memory - MemoryStore-specific options
 * @param options.sqlite - SqliteStore-specific options
 */
export function createStore(options: CreateStoreOptions = {}): BaseStore {
  const { type = 'memory', memory, sqlite, ...baseOptions } = options;

  switch (type) {
    case 'sqlite':
      return new SqliteStore({ ...baseOptions, ...sqlite });
    case 'memory':
    default:
      return new MemoryStore({ ...baseOptions, ...memory });
  }
}

/**
 * Detect the best store type for the environment.
 *
 * - STDIO transport: memory (single client, no persistence needed)
 * - HTTP transport: sqlite (multi-client, shared state across workers)
 */
export function detectStoreType(transport: 'stdio' | 'http'): StoreType {
  return transport === 'stdio' ? 'memory' : 'sqlite';
}
