/**
 * Unit tests for S3 File Backend
 *
 * Tests core functionality using mock S3 client.
 * For integration tests with real S3/MinIO, use the Docker Compose setup.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  S3FileBackend,
  type S3Client,
  type S3Command,
  type S3CommandOutput,
  type S3CommandFactories,
} from './s3-file-backend.js';

/**
 * Create mock S3 command factories.
 */
function createMockCommandFactories(): S3CommandFactories {
  return {
    PutObjectCommand: class {
      input: Record<string, unknown>;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    } as S3CommandFactories['PutObjectCommand'],
    GetObjectCommand: class {
      input: Record<string, unknown>;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    } as S3CommandFactories['GetObjectCommand'],
    DeleteObjectCommand: class {
      input: Record<string, unknown>;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    } as S3CommandFactories['DeleteObjectCommand'],
    ListObjectsV2Command: class {
      input: Record<string, unknown>;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    } as S3CommandFactories['ListObjectsV2Command'],
    DeleteObjectsCommand: class {
      input: Record<string, unknown>;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    } as S3CommandFactories['DeleteObjectsCommand'],
  };
}

/**
 * Create a mock S3 client for testing.
 */
function createMockS3Client(): S3Client & {
  objects: Map<string, string>;
  calls: Array<{ commandType: string; input: Record<string, unknown> }>;
} {
  const objects = new Map<string, string>();
  const calls: Array<{ commandType: string; input: Record<string, unknown> }> =
    [];

  return {
    objects,
    calls,
    async send(command: S3Command): Promise<S3CommandOutput> {
      const commandType = command.constructor.name;
      const input = command.input;
      calls.push({ commandType, input });

      switch (commandType) {
        case 'PutObjectCommand': {
          const key = input.Key as string;
          const body = input.Body as string;
          objects.set(key, body);
          return {};
        }

        case 'GetObjectCommand': {
          const key = input.Key as string;
          const content = objects.get(key);
          if (!content) {
            const error = new Error('NoSuchKey');
            (error as Error & { name: string }).name = 'NoSuchKey';
            throw error;
          }
          return {
            Body: {
              async transformToString() {
                return content;
              },
            },
          };
        }

        case 'DeleteObjectCommand': {
          const key = input.Key as string;
          objects.delete(key);
          return {};
        }

        case 'ListObjectsV2Command': {
          const prefix = (input.Prefix as string) ?? '';
          const contents = Array.from(objects.keys())
            .filter((key) => key.startsWith(prefix))
            .map((key) => ({ Key: key }));
          return { Contents: contents };
        }

        case 'DeleteObjectsCommand': {
          const deleteInput = input.Delete as {
            Objects: Array<{ Key: string }>;
          };
          for (const obj of deleteInput.Objects) {
            objects.delete(obj.Key);
          }
          return {};
        }

        default:
          throw new Error(`Unknown command: ${commandType}`);
      }
    },
  };
}

describe('S3FileBackend', () => {
  let backend: S3FileBackend;
  let mockClient: ReturnType<typeof createMockS3Client>;
  let mockCommands: S3CommandFactories;

  beforeEach(async () => {
    mockClient = createMockS3Client();
    mockCommands = createMockCommandFactories();

    backend = new S3FileBackend(
      {
        client: mockClient,
        bucket: 'test-bucket',
        prefix: 'specs/',
      },
      mockCommands
    );

    await backend.initialize();
  });

  describe('type', () => {
    test('returns s3', () => {
      assert.strictEqual(backend.type, 's3');
    });
  });

  describe('initialize', () => {
    test('completes without error', async () => {
      const newBackend = new S3FileBackend(
        {
          client: mockClient,
          bucket: 'another-bucket',
        },
        mockCommands
      );

      await assert.doesNotReject(async () => {
        await newBackend.initialize();
      });
    });
  });

  describe('write', () => {
    test('writes content to S3', async () => {
      const content = '{"openapi": "3.0.0"}';
      const result = await backend.write('test.json', content);

      assert.ok(result.includes('s3://'), 'Should return S3 URI');
      assert.ok(result.includes('test-bucket'), 'Should include bucket');
      assert.ok(result.includes('specs/test.json'), 'Should include full key');

      // Verify content was stored
      assert.ok(mockClient.objects.has('specs/test.json'));
      assert.strictEqual(mockClient.objects.get('specs/test.json'), content);
    });

    test('writes YAML with correct content type', async () => {
      const content = 'openapi: "3.0.0"';
      await backend.write('test.yaml', content);

      const putCall = mockClient.calls.find(
        (c) => c.commandType === 'PutObjectCommand'
      );
      assert.ok(putCall, 'Should have PutObject call');
      assert.strictEqual(
        putCall.input.ContentType,
        'application/x-yaml',
        'Should set YAML content type'
      );
    });

    test('writes JSON with correct content type', async () => {
      const content = '{"openapi": "3.0.0"}';
      await backend.write('test.json', content);

      const putCall = mockClient.calls.find(
        (c) => c.commandType === 'PutObjectCommand'
      );
      assert.ok(putCall, 'Should have PutObject call');
      assert.strictEqual(
        putCall.input.ContentType,
        'application/json',
        'Should set JSON content type'
      );
    });

    test('applies prefix to key', async () => {
      await backend.write('myfile.json', '{}');

      assert.ok(
        mockClient.objects.has('specs/myfile.json'),
        'Should use prefixed key'
      );
    });
  });

  describe('read', () => {
    test('reads content from S3', async () => {
      const content = '{"test": true}';
      await backend.write('read-test.json', content);

      const result = await backend.read('read-test.json');

      assert.strictEqual(result, content, 'Should return stored content');
    });

    test('returns null for non-existent key', async () => {
      const result = await backend.read('does-not-exist.json');

      assert.strictEqual(result, null, 'Should return null');
    });
  });

  describe('delete', () => {
    test('deletes object from S3', async () => {
      await backend.write('to-delete.json', '{}');
      assert.ok(mockClient.objects.has('specs/to-delete.json'));

      await backend.delete('to-delete.json');

      assert.ok(
        !mockClient.objects.has('specs/to-delete.json'),
        'Object should be deleted'
      );
    });

    test('does not throw for non-existent key', async () => {
      await assert.doesNotReject(async () => {
        await backend.delete('does-not-exist.json');
      });
    });
  });

  describe('deleteAll', () => {
    test('deletes all objects with prefix', async () => {
      await backend.write('file1.json', '{}');
      await backend.write('file2.json', '{}');
      await backend.write('file3.yaml', '{}');

      assert.strictEqual(mockClient.objects.size, 3);

      await backend.deleteAll();

      assert.strictEqual(mockClient.objects.size, 0, 'All objects deleted');
    });

    test('handles empty bucket', async () => {
      await assert.doesNotReject(async () => {
        await backend.deleteAll();
      });
    });
  });

  describe('without prefix', () => {
    beforeEach(async () => {
      backend = new S3FileBackend(
        {
          client: mockClient,
          bucket: 'test-bucket',
          // No prefix
        },
        mockCommands
      );
      mockClient.objects.clear();
      mockClient.calls.length = 0;
    });

    test('writes without prefix', async () => {
      await backend.write('root-file.json', '{}');

      assert.ok(
        mockClient.objects.has('root-file.json'),
        'Should store at root level'
      );
    });
  });
});
