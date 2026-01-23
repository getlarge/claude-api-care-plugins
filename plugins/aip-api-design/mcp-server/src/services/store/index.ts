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
  ListOptions,
  ListResult,
} from './base.js';

export { MemoryStore } from './memory.js';
export type { MemoryStoreOptions } from './memory.js';
export { SqliteStore } from './sqlite.js';
export type { SqliteStoreOptions } from './sqlite.js';
export { PostgresStore } from './postgres.js';
export type { PostgresStoreOptions } from './postgres.js';
export type { FileBackend } from './file-backend.js';
export {
  LocalFileBackend,
  S3FileBackend,
  createS3FileBackend,
} from './file-backend.js';
export type { S3FileBackendOptions, S3Client } from './file-backend.js';

import { BaseStore } from './base.js';
import type { StoreOptions } from './base.js';
import { MemoryStore } from './memory.js';
import type { MemoryStoreOptions } from './memory.js';
import { SqliteStore } from './sqlite.js';
import type { SqliteStoreOptions } from './sqlite.js';
import { PostgresStore } from './postgres.js';
import type { PostgresStoreOptions } from './postgres.js';
import type { FileBackend } from './file-backend.js';

export type StoreType = 'memory' | 'sqlite' | 'postgres';

export type CreateStoreOptions = StoreOptions & {
  type?: StoreType;
  memory?: Omit<MemoryStoreOptions, keyof StoreOptions>;
  sqlite?: Omit<SqliteStoreOptions, keyof StoreOptions>;
  postgres?: Omit<PostgresStoreOptions, keyof StoreOptions>;
  /** File backend to use for content storage (SQLite and PostgreSQL) */
  fileBackend?: FileBackend;
};

/**
 * Create a store based on configuration.
 *
 * @param options.type - 'memory' for STDIO/tests, 'sqlite' for HTTP/production, 'postgres' for production with PostgreSQL
 * @param options.memory - MemoryStore-specific options
 * @param options.sqlite - SqliteStore-specific options
 * @param options.postgres - PostgresStore-specific options
 * @param options.fileBackend - File backend for content storage (applies to sqlite/postgres)
 */
export function createStore(options: CreateStoreOptions = {}): BaseStore {
  const {
    type = 'memory',
    memory,
    sqlite,
    postgres,
    fileBackend,
    ...baseOptions
  } = options;

  switch (type) {
    case 'postgres':
      return new PostgresStore({ ...baseOptions, ...postgres, fileBackend });
    case 'sqlite':
      return new SqliteStore({ ...baseOptions, ...sqlite, fileBackend });
    case 'memory':
    default:
      return new MemoryStore({ ...baseOptions, ...memory });
  }
}

/**
 * Detect the best store type for the environment.
 *
 * - STDIO transport: memory (single client, no persistence needed)
 * - HTTP transport: sqlite or postgres based on DATABASE_URL env var
 */
export function detectStoreType(transport: 'stdio' | 'http'): StoreType {
  if (transport === 'stdio') {
    return 'memory';
  }
  // Use postgres if DATABASE_URL is set
  if (process.env['DATABASE_URL']) {
    return 'postgres';
  }
  return 'sqlite';
}
