/**
 * Integration tests for MCP resources
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerResourcesList } from './list.js';
import { registerResourcesRead } from './read.js';
import {
  initTempStorage,
  shutdownTempStorage,
  getTempStorage,
} from '../services/temp-storage.js';
import {
  initFindingsStorage,
  shutdownFindingsStorage,
  getFindingsStorage,
} from '../services/findings-storage.js';

describe('MCP Resources Integration', () => {
  let server: Server;

  before(async () => {
    // Initialize storage
    await initTempStorage({ type: 'memory', ttlMs: 60000 });
    await initFindingsStorage({ type: 'memory', ttlMs: 60000 });

    // Create MCP server and register handlers
    server = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { resources: {} } }
    );
    registerResourcesList(server);
    registerResourcesRead(server);
  });

  after(async () => {
    await shutdownTempStorage();
    await shutdownFindingsStorage();
  });

  describe('Full resource lifecycle', () => {
    it('should create, list, and read a spec resource', async () => {
      const tempStorage = getTempStorage();

      // 1. Create a resource
      const testSpec = { openapi: '3.0.0', info: { title: 'Test API' } };
      const storeResult = await tempStorage.store(testSpec, {
        id: 'test-spec-123',
        contentType: 'json',
      });

      assert.strictEqual(storeResult.id, 'test-spec-123');
      assert.ok(storeResult.expiresAt > Date.now());

      // 2. List resources - should include our spec
      // @ts-expect-error: accessing private _requestHandlers Map
      const listHandler = server._requestHandlers.get('resources/list');
      assert.ok(listHandler);

      const listResponse = await listHandler({
        method: 'resources/list',
        params: {},
      });
      assert.ok(listResponse.resources);
      assert.ok(listResponse.resources.length > 0);

      const ourResource = listResponse.resources.find(
        (r: { uri: string }) => r.uri === 'aip://specs/test-spec-123'
      );
      assert.ok(ourResource);
      assert.ok(ourResource.name.includes('test-spec-123'));
      assert.strictEqual(ourResource.mimeType, 'application/json');

      // 3. Read the resource
      // @ts-expect-error: accessing private _requestHandlers Map
      const readHandler = server._requestHandlers.get('resources/read');
      assert.ok(readHandler);

      const readResponse = await readHandler({
        method: 'resources/read',
        params: { uri: 'aip://specs/test-spec-123' },
      });

      assert.ok(readResponse.contents);
      assert.strictEqual(readResponse.contents.length, 1);
      assert.strictEqual(
        readResponse.contents[0].uri,
        'aip://specs/test-spec-123'
      );
      assert.strictEqual(readResponse.contents[0].mimeType, 'application/json');

      const content = JSON.parse(readResponse.contents[0].text);
      assert.deepStrictEqual(content, testSpec);
    });

    it('should create, list, and read a findings resource', async () => {
      const findingsStorage = getFindingsStorage();

      // 1. Create findings
      const testFindings = {
        reviewId: 'review-456',
        findings: [{ ruleId: 'test-rule', severity: 'error' }],
      };
      const storeResult = await findingsStorage.store(testFindings, {
        id: 'findings-456',
        contentType: 'json',
      });

      assert.strictEqual(storeResult.id, 'findings-456');

      // 2. List resources - should include our findings
      // @ts-expect-error: accessing private _requestHandlers Map
      const listHandler = server._requestHandlers.get('resources/list');
      const listResponse = await listHandler({
        method: 'resources/list',
        params: {},
      });

      const ourFindings = listResponse.resources.find(
        (r: { uri: string }) => r.uri === 'aip://findings/findings-456'
      );
      assert.ok(ourFindings);
      assert.ok(ourFindings.name.includes('findings-456'));
      assert.strictEqual(ourFindings.mimeType, 'application/json');

      // 3. Read the findings
      // @ts-expect-error: accessing private _requestHandlers Map
      const readHandler = server._requestHandlers.get('resources/read');
      const readResponse = await readHandler({
        method: 'resources/read',
        params: { uri: 'aip://findings/findings-456' },
      });

      const content = JSON.parse(readResponse.contents[0].text);
      assert.deepStrictEqual(content, testFindings);
    });

    it('should return 404 for non-existent resource', async () => {
      // @ts-expect-error: accessing private _requestHandlers Map
      const readHandler = server._requestHandlers.get('resources/read');

      await assert.rejects(
        async () => {
          await readHandler({
            method: 'resources/read',
            params: { uri: 'aip://specs/does-not-exist' },
          });
        },
        (error: Error) => {
          assert.ok(error.message.includes('Resource not found'));
          return true;
        }
      );
    });

    it('should reject invalid URI format', async () => {
      // @ts-expect-error: accessing private _requestHandlers Map
      const readHandler = server._requestHandlers.get('resources/read');

      await assert.rejects(
        async () => {
          await readHandler({
            method: 'resources/read',
            params: { uri: 'invalid://wrong/format' },
          });
        },
        (error: Error) => {
          assert.ok(error.message.includes('Invalid resource URI'));
          return true;
        }
      );
    });
  });

  describe('Pagination', () => {
    it('should handle paginated listing', async () => {
      const tempStorage = getTempStorage();

      // Create multiple resources
      for (let i = 0; i < 3; i++) {
        await tempStorage.store(
          { test: i },
          {
            id: `pagination-test-${i}`,
            contentType: 'json',
          }
        );
      }

      // @ts-expect-error: accessing private _requestHandlers Map
      const listHandler = server._requestHandlers.get('resources/list');

      // First page
      const page1 = await listHandler({
        method: 'resources/list',
        params: { pageSize: 2 },
      });

      assert.ok(page1.resources.length >= 2);
      // Note: May have more resources from other tests

      // If there's a next cursor, fetch next page
      if (page1.nextCursor) {
        const page2 = await listHandler({
          method: 'resources/list',
          params: { cursor: page1.nextCursor, pageSize: 2 },
        });
        assert.ok(page2.resources);
      }
    });
  });

  describe('YAML content type', () => {
    it('should handle YAML specs correctly', async () => {
      const tempStorage = getTempStorage();

      const yamlSpec = { openapi: '3.0.0', info: { title: 'YAML Test' } };
      await tempStorage.store(yamlSpec, {
        id: 'yaml-test-789',
        contentType: 'yaml',
      });

      // @ts-expect-error: accessing private _requestHandlers Map
      const listHandler = server._requestHandlers.get('resources/list');
      const listResponse = await listHandler({
        method: 'resources/list',
        params: {},
      });

      const yamlResource = listResponse.resources.find(
        (r: { uri: string }) => r.uri === 'aip://specs/yaml-test-789'
      );
      assert.ok(yamlResource);
      assert.strictEqual(yamlResource.mimeType, 'application/x-yaml');

      // @ts-expect-error: accessing private _requestHandlers Map
      const readHandler = server._requestHandlers.get('resources/read');
      const readResponse = await readHandler({
        method: 'resources/read',
        params: { uri: 'aip://specs/yaml-test-789' },
      });

      assert.strictEqual(
        readResponse.contents[0].mimeType,
        'application/x-yaml'
      );
    });
  });
});
