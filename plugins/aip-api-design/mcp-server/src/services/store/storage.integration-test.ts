/**
 * Integration tests for Storage Backends
 *
 * Tests all storage backends against real services using Docker Compose.
 *
 * Prerequisites:
 *   npm run docker:up
 *
 * Run with:
 *   npm run test:integration
 *
 * Environment variables (from .env.test):
 *   DATABASE_URL - PostgreSQL connection string
 *   S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY - MinIO config
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

import { MemoryStore } from './memory.js';
import { SqliteStore } from './sqlite.js';
import { PostgresStore } from './postgres.js';
import { LocalFileBackend } from './file-backend.js';
import { createS3FileBackend } from './s3-file-backend.js';
import type { BaseStore } from './base.js';
import type { FileBackend } from './file-backend.js';

// Test spec fixture
const TEST_SPEC = {
  openapi: '3.0.0',
  info: { title: 'Integration Test API', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        responses: { '200': { description: 'OK' } },
      },
    },
  },
};

// Skip integration tests if services aren't available
const SKIP_POSTGRES = !process.env['DATABASE_URL'];
const SKIP_S3 =
  !process.env['S3_ENDPOINT'] ||
  !process.env['S3_ACCESS_KEY_ID'] ||
  !process.env['S3_SECRET_ACCESS_KEY'];

/**
 * Run standard storage tests against any BaseStore implementation
 */
async function runStorageTests(
  storeName: string,
  createStore: () => Promise<BaseStore>
) {
  describe(`${storeName} Storage`, () => {
    let store: BaseStore;

    before(async () => {
      store = await createStore();
      await store.initialize();
    });

    after(async () => {
      if (store) {
        await store.shutdown();
      }
    });

    test('stores and retrieves spec', async () => {
      const result = await store.store(TEST_SPEC);

      assert.ok(result.id, 'Should return id');
      assert.ok(result.expiresAt > Date.now(), 'Should have future expiry');

      const retrieved = await store.get(result.id);
      assert.ok(retrieved, 'Should retrieve stored spec');
      assert.strictEqual(retrieved.id, result.id);

      const parsed = JSON.parse(retrieved.content);
      assert.strictEqual(parsed.openapi, '3.0.0');
      assert.strictEqual(parsed.info.title, 'Integration Test API');
    });

    test('stores with custom ID', async () => {
      const customId = `test-${Date.now()}`;
      const result = await store.store(TEST_SPEC, { id: customId });

      assert.strictEqual(result.id, customId);

      const retrieved = await store.get(customId);
      assert.ok(retrieved, 'Should retrieve by custom ID');
    });

    test('stores YAML content type', async () => {
      const result = await store.store(TEST_SPEC, { contentType: 'yaml' });

      const retrieved = await store.get(result.id);
      assert.ok(retrieved, 'Should retrieve YAML spec');
      assert.strictEqual(retrieved.contentType, 'yaml');
      assert.ok(
        retrieved.content.includes('openapi:'),
        'Content should be YAML formatted'
      );
    });

    test('returns null for non-existent ID', async () => {
      const retrieved = await store.get('non-existent-id-12345');
      assert.strictEqual(retrieved, null);
    });

    test('deletes stored spec', async () => {
      const result = await store.store(TEST_SPEC);
      assert.ok(await store.get(result.id), 'Should exist before delete');

      await store.delete(result.id);

      const retrieved = await store.get(result.id);
      assert.strictEqual(retrieved, null, 'Should be deleted');
    });

    test('updates existing spec with same ID', async () => {
      const customId = `update-test-${Date.now()}`;
      await store.store(TEST_SPEC, { id: customId });

      const updatedSpec = {
        ...TEST_SPEC,
        info: { ...TEST_SPEC.info, version: '2.0.0' },
      };
      await store.store(updatedSpec, { id: customId });

      const retrieved = await store.get(customId);
      assert.ok(retrieved, 'Should retrieve updated spec');

      const parsed = JSON.parse(retrieved.content);
      assert.strictEqual(
        parsed.info.version,
        '2.0.0',
        'Should have updated version'
      );
    });

    test('reports stats', () => {
      const stats = store.stats;
      assert.ok(stats.type, 'Should have type in stats');
      assert.strictEqual(typeof stats.count, 'number', 'Should have count');
    });
  });
}

/**
 * Run file backend tests
 */
async function runFileBackendTests(
  backendName: string,
  createBackend: () => Promise<FileBackend>
) {
  describe(`${backendName} FileBackend`, () => {
    let backend: FileBackend;

    before(async () => {
      backend = await createBackend();
      await backend.initialize();
    });

    after(async () => {
      if (backend) {
        await backend.deleteAll();
      }
    });

    test('writes and reads file', async () => {
      const filename = `test-${Date.now()}.json`;
      const content = JSON.stringify(TEST_SPEC);

      const path = await backend.write(filename, content);
      assert.ok(path, 'Should return path/URI');

      const retrieved = await backend.read(filename);
      assert.strictEqual(retrieved, content, 'Should read back same content');
    });

    test('returns null for non-existent file', async () => {
      const retrieved = await backend.read('does-not-exist-12345.json');
      assert.strictEqual(retrieved, null);
    });

    test('deletes file', async () => {
      const filename = `delete-test-${Date.now()}.json`;
      await backend.write(filename, '{}');

      await backend.delete(filename);

      const retrieved = await backend.read(filename);
      assert.strictEqual(retrieved, null, 'Should be deleted');
    });

    test('handles YAML content', async () => {
      const filename = `test-${Date.now()}.yaml`;
      const content = 'openapi: "3.0.0"\ninfo:\n  title: Test';

      await backend.write(filename, content);

      const retrieved = await backend.read(filename);
      assert.strictEqual(retrieved, content);
    });
  });
}

// =============================================================================
// Memory Store Tests (always run)
// =============================================================================

await runStorageTests('Memory', async () => {
  return new MemoryStore({ ttlMs: 60000, useFileSystem: false });
});

await runStorageTests('Memory+Filesystem', async () => {
  return new MemoryStore({
    ttlMs: 60000,
    useFileSystem: true,
    tempDirName: `aip-integration-test-${Date.now()}`,
  });
});

// =============================================================================
// SQLite Store Tests (always run)
// =============================================================================

await runStorageTests('SQLite+LocalFile', async () => {
  const tmpDir = `/tmp/aip-integration-test-${Date.now()}`;
  return new SqliteStore({
    ttlMs: 60000,
    dbPath: `${tmpDir}/test.db`,
    fileBackend: new LocalFileBackend(tmpDir),
  });
});

// =============================================================================
// Local File Backend Tests (always run)
// =============================================================================

await runFileBackendTests('Local', async () => {
  return new LocalFileBackend(`/tmp/aip-file-backend-test-${Date.now()}`);
});

// =============================================================================
// PostgreSQL Tests (requires Docker)
// =============================================================================

if (SKIP_POSTGRES) {
  describe('PostgreSQL Storage', () => {
    test.skip('SKIPPED - DATABASE_URL not set (run: npm run docker:up)', () => {});
  });
} else {
  await runStorageTests('PostgreSQL+LocalFile', async () => {
    return new PostgresStore({
      ttlMs: 60000,
      connectionUrl: process.env['DATABASE_URL'],
      tableName: `integration_test_${Date.now()}`,
      fileBackend: new LocalFileBackend(`/tmp/aip-pg-test-${Date.now()}`),
    });
  });

  // PostgreSQL + S3 combination
  if (!SKIP_S3) {
    await runStorageTests('PostgreSQL+S3', async () => {
      const s3Backend = await createS3FileBackend({
        endpoint: process.env['S3_ENDPOINT']!,
        accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
        secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
        bucket: process.env['S3_BUCKET_SPECS'] ?? 'aip-specs',
        prefix: `integration-test-${Date.now()}/`,
        region: process.env['S3_REGION'] ?? 'us-east-1',
        forcePathStyle: true,
      });

      return new PostgresStore({
        ttlMs: 60000,
        connectionUrl: process.env['DATABASE_URL'],
        tableName: `integration_test_s3_${Date.now()}`,
        fileBackend: s3Backend,
      });
    });
  }
}

// =============================================================================
// S3 File Backend Tests (requires Docker)
// =============================================================================

if (SKIP_S3) {
  describe('S3 FileBackend', () => {
    test.skip('SKIPPED - S3_* env vars not set (run: npm run docker:up)', () => {});
  });
} else {
  await runFileBackendTests('S3/MinIO', async () => {
    return createS3FileBackend({
      endpoint: process.env['S3_ENDPOINT']!,
      accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
      bucket: process.env['S3_BUCKET_SPECS'] ?? 'aip-specs',
      prefix: `file-backend-test-${Date.now()}/`,
      region: process.env['S3_REGION'] ?? 'us-east-1',
      forcePathStyle: true,
    });
  });
}

// =============================================================================
// SQLite + S3 Combination Tests
// =============================================================================

if (SKIP_S3) {
  describe('SQLite+S3 Storage', () => {
    test.skip('SKIPPED - S3_* env vars not set (run: npm run docker:up)', () => {});
  });
} else {
  await runStorageTests('SQLite+S3', async () => {
    const tmpDir = `/tmp/aip-sqlite-s3-test-${Date.now()}`;
    const s3Backend = await createS3FileBackend({
      endpoint: process.env['S3_ENDPOINT']!,
      accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
      bucket: process.env['S3_BUCKET_SPECS'] ?? 'aip-specs',
      prefix: `sqlite-s3-test-${Date.now()}/`,
      region: process.env['S3_REGION'] ?? 'us-east-1',
      forcePathStyle: true,
    });

    return new SqliteStore({
      ttlMs: 60000,
      dbPath: `${tmpDir}/test.db`,
      fileBackend: s3Backend,
    });
  });
}
