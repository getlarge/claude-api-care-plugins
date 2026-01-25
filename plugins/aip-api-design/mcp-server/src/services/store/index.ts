/**
 * Store Module
 *
 * Exports storage implementations and factory for creating stores.
 *
 * Directory structure:
 * - meta/   - Metadata stores (memory, sqlite, postgres)
 * - files/  - File backends (local, s3)
 */

export { BaseStore } from './meta/base.js';
export type {
  StoredSpec,
  StoreOptions,
  StoreResult,
  StoreStats,
  ListOptions,
  ListResult,
} from './meta/base.js';

// Re-export from meta stores
export { MemoryStore, SqliteStore, PostgresStore } from './meta/index.js';
export type {
  MemoryStoreOptions,
  SqliteStoreOptions,
  PostgresStoreOptions,
} from './meta/index.js';

// Re-export from file backends
export {
  LocalFileBackend,
  S3FileBackend,
  createS3FileBackend,
} from './files/index.js';
export type {
  FileBackend,
  S3FileBackendOptions,
  S3Client,
} from './files/index.js';

import { BaseStore } from './meta/base.js';
import type { StoreOptions } from './meta/base.js';
import { MemoryStore, SqliteStore, PostgresStore } from './meta/index.js';
import type {
  MemoryStoreOptions,
  SqliteStoreOptions,
  PostgresStoreOptions,
} from './meta/index.js';
import type { FileBackend } from './files/index.js';

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
