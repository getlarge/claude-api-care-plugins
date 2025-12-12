/**
 * Store Module
 *
 * Exports storage implementations and factory for creating stores.
 */

export {
  BaseStore,
  StoredSpec,
  StoreOptions,
  StoreResult,
  StoreStats,
} from './base.js';

export { MemoryStore, MemoryStoreOptions } from './memory.js';
export { SqliteStore, SqliteStoreOptions } from './sqlite.js';
export { FileBackend, LocalFileBackend } from './file-backend.js';

import { BaseStore, StoreOptions } from './base.js';
import { MemoryStore, MemoryStoreOptions } from './memory.js';
import { SqliteStore, SqliteStoreOptions } from './sqlite.js';

export type StoreType = 'memory' | 'sqlite';

export interface CreateStoreOptions extends StoreOptions {
  type?: StoreType;
  memory?: Omit<MemoryStoreOptions, keyof StoreOptions>;
  sqlite?: Omit<SqliteStoreOptions, keyof StoreOptions>;
}

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
