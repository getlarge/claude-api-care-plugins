/**
 * Unit tests for PostgreSQL Store
 *
 * Tests core functionality using a mock pg Pool.
 * For integration tests with real PostgreSQL, use the Docker Compose setup.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PostgresStore, type PgPool } from './postgres.js';
import type { FileBackend } from './file-backend.js';

/**
 * Create a mock file backend for testing.
 */
function createMockFileBackend(): FileBackend & {
  files: Map<string, string>;
  initCalled: boolean;
} {
  const files = new Map<string, string>();
  return {
    type: 'mock',
    files,
    initCalled: false,
    async initialize() {
      this.initCalled = true;
    },
    async write(filename: string, content: string) {
      files.set(filename, content);
      return filename;
    },
    async read(filename: string) {
      return files.get(filename) ?? null;
    },
    async delete(filename: string) {
      files.delete(filename);
    },
    async deleteAll() {
      files.clear();
    },
  };
}

interface MockPoolRow {
  id?: string;
  filename?: string;
  content_type?: string;
  created_at?: string;
  expires_at?: string;
  session_id?: string | null;
  count?: string;
  '?column?'?: number;
}

/**
 * Create a mock PostgreSQL pool for testing.
 */
function createMockPool() {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  const mockData = new Map<string, MockPoolRow>();

  const pool = {
    queries,
    mockData,
    async query(
      text: string,
      values?: unknown[]
    ): Promise<{ rows: MockPoolRow[]; rowCount: number | null }> {
      queries.push({ text, values });

      // Return mock data based on query type
      if (text.includes('SELECT 1 FROM')) {
        // Check if exists
        const id = values?.[0];
        const exists = mockData.has(`spec:${id}`);
        return {
          rows: exists ? [{ '?column?': 1 }] : [],
          rowCount: exists ? 1 : 0,
        };
      }

      if (text.includes('SELECT') && text.includes('WHERE id = ')) {
        const id = values?.[0];
        const data = mockData.get(`spec:${id}`);
        return { rows: data ? [data] : [], rowCount: data ? 1 : 0 };
      }

      if (text.includes('SELECT') && text.includes('WHERE expires_at')) {
        // List or cleanup query
        return { rows: [], rowCount: 0 };
      }

      if (text.includes('SELECT COUNT')) {
        return {
          rows: [{ count: String(mockData.size) }],
          rowCount: 1,
        };
      }

      if (text.includes('INSERT') || text.includes('UPDATE')) {
        // Store operation
        if (values && values.length >= 6) {
          const id = values[0] as string;
          mockData.set(`spec:${id}`, {
            id,
            filename: values[1] as string,
            content_type: values[2] as string,
            created_at: String(values[3]),
            expires_at: String(values[4]),
            session_id: values[5] as string | null,
          });
        }
        return { rows: [], rowCount: 1 };
      }

      if (text.includes('DELETE')) {
        const deletedCount = mockData.size;
        if (values?.[0]) {
          mockData.delete(`spec:${values[0]}`);
        } else {
          mockData.clear();
        }
        return { rows: [], rowCount: deletedCount };
      }

      if (text.includes('CREATE TABLE') || text.includes('CREATE INDEX')) {
        return { rows: [], rowCount: 0 };
      }

      return { rows: [], rowCount: 0 };
    },
    async end() {
      // No-op
    },
  };

  return pool as unknown as PgPool & {
    queries: Array<{ text: string; values?: unknown[] }>;
    mockData: Map<string, MockPoolRow>;
  };
}

describe('PostgresStore', () => {
  let store: PostgresStore;
  let mockPool: ReturnType<typeof createMockPool>;
  let mockFileBackend: ReturnType<typeof createMockFileBackend>;

  beforeEach(async () => {
    mockPool = createMockPool();
    mockFileBackend = createMockFileBackend();

    store = new PostgresStore({
      pool: mockPool,
      fileBackend: mockFileBackend,
      ttlMs: 60000,
    });

    await store.initialize();
  });

  describe('initialize', () => {
    test('creates table and indexes', async () => {
      const createTableQueries = mockPool.queries.filter((q) =>
        q.text.includes('CREATE TABLE')
      );
      const createIndexQueries = mockPool.queries.filter((q) =>
        q.text.includes('CREATE INDEX')
      );

      assert.ok(createTableQueries.length >= 1, 'Should create table');
      assert.ok(
        createIndexQueries.length >= 1,
        'Should create at least one index'
      );
    });

    test('initializes file backend', async () => {
      assert.ok(mockFileBackend.initCalled, 'Should initialize file backend');
    });
  });

  describe('store', () => {
    test('stores spec with JSON content type', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
      };
      const result = await store.store(spec);

      assert.ok(result.id, 'Should return id');
      assert.ok(result.expiresAt > Date.now(), 'Should have future expiry');

      // Check file was written
      assert.ok(mockFileBackend.files.size === 1, 'Should write one file');
      const fileContent = Array.from(mockFileBackend.files.values())[0];
      assert.ok(fileContent.includes('openapi'), 'File should contain spec');
    });

    test('stores spec with custom ID', async () => {
      const spec = { openapi: '3.0.0' };
      const result = await store.store(spec, { id: 'custom-id-123' });

      assert.strictEqual(result.id, 'custom-id-123', 'Should use custom ID');
    });

    test('stores spec with YAML content type', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
      };
      const result = await store.store(spec, { contentType: 'yaml' });

      assert.ok(result.id, 'Should return id');

      // Check file extension
      const filename = Array.from(mockFileBackend.files.keys())[0];
      assert.ok(filename.endsWith('.yaml'), 'Should have yaml extension');
    });
  });

  describe('get', () => {
    test('retrieves stored spec', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0' },
      };
      const storeResult = await store.store(spec);

      // Manually set up mock data for retrieval
      const filename = Array.from(mockFileBackend.files.keys())[0];
      mockPool.mockData.set(`spec:${storeResult.id}`, {
        id: storeResult.id,
        filename,
        content_type: 'json',
        created_at: String(Date.now()),
        expires_at: String(storeResult.expiresAt),
        session_id: null,
      });

      const retrieved = await store.get(storeResult.id);

      assert.ok(retrieved, 'Should retrieve spec');
      assert.strictEqual(retrieved.id, storeResult.id);
      assert.strictEqual(retrieved.contentType, 'json');
      assert.ok(retrieved.content.includes('openapi'));
    });

    test('returns null for non-existent spec', async () => {
      const retrieved = await store.get('non-existent-id');
      assert.strictEqual(retrieved, null, 'Should return null');
    });
  });

  describe('delete', () => {
    test('deletes spec and file', async () => {
      const spec = { openapi: '3.0.0' };
      const result = await store.store(spec);

      // Set up mock data
      const filename = Array.from(mockFileBackend.files.keys())[0];
      mockPool.mockData.set(`spec:${result.id}`, { filename });

      await store.delete(result.id);

      // File should be deleted
      assert.strictEqual(
        mockFileBackend.files.size,
        0,
        'File should be deleted'
      );
    });
  });

  describe('getCount', () => {
    test('returns count from database', async () => {
      // Store some specs to have items
      await store.store({ test: 1 });
      await store.store({ test: 2 });

      const count = await store.getCount();
      assert.strictEqual(typeof count, 'number', 'Should return a number');
    });
  });

  describe('stats', () => {
    test('returns type with file backend', () => {
      const stats = store.stats;

      assert.ok(
        stats.type.includes('postgres'),
        'Should include postgres in type'
      );
      assert.ok(
        stats.type.includes('mock'),
        'Should include file backend type'
      );
    });
  });

  describe('shutdown', () => {
    test('cleans up resources', async () => {
      await store.store({ test: 1 });

      await store.shutdown();

      // File backend should be cleared
      assert.strictEqual(
        mockFileBackend.files.size,
        0,
        'Files should be cleared'
      );
    });
  });
});
