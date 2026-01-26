/**
 * HTTP E2E tests for baume-review tool
 *
 * Tests the review tool via HTTP transport.
 * Requires the MCP server to be running (manually or via Docker Compose).
 *
 * Run with:
 *   npm run test:e2e:http
 *
 * Or start the server first:
 *   npm run start &
 *   npm run test:e2e:http
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  HttpMcpTestClient,
  waitForServer,
} from '../test-helpers/http-mcp-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(
  __dirname,
  '..',
  '..',
  '..',
  'openapi-reviewer',
  'tests',
  'fixtures'
);
const TEST_SPEC = join(FIXTURES_DIR, 'acme-commerce.yaml');

// Server URL from environment or default
const SERVER_URL = process.env['MCP_SERVER_URL'] ?? 'http://localhost:4000';

describe('baume-review HTTP E2E', () => {
  const client = new HttpMcpTestClient({ baseUrl: SERVER_URL });

  before(async () => {
    // Wait for server to be ready
    await waitForServer(SERVER_URL, { timeout: 60000, interval: 2000 });
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('Health endpoint', () => {
    test('returns health status', async () => {
      const health = await client.health();

      assert.strictEqual(health.status, 'ok');
      assert.ok(health.version, 'Should have version');
      assert.ok(health.tempStorage, 'Should have tempStorage stats');
      assert.strictEqual(typeof health.tempStorage.count, 'number');
      assert.ok(health.tempStorage.type, 'Should have storage type');
    });
  });

  describe('Tool listing', () => {
    test('lists available tools', async () => {
      const response = await client.listTools();

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result, 'Should have result');

      // The tools/list response has a different structure
      const tools = (response.result as { tools?: Array<{ name: string }> })
        .tools;
      assert.ok(Array.isArray(tools), 'Should have tools array');
      assert.ok(tools.length > 0, 'Should have at least one tool');

      const toolNames = tools.map((t) => t.name);
      assert.ok(
        toolNames.includes('baume-review'),
        'Should have baume-review tool'
      );
      assert.ok(
        toolNames.includes('baume-list-rules'),
        'Should have baume-list-rules tool'
      );
    });
  });

  describe('Review with specPath', () => {
    test('returns reviewId and summary for local file', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });

      assert.ok(!response.result?.isError, 'Should not be an error');
      assert.ok(response.result?.content, 'Should have content');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content as JSON');

      assert.ok(content.reviewId, 'Should have reviewId');
      assert.ok(content.specPath, 'Should have specPath');
      assert.ok(content.summary, 'Should have summary');
      assert.ok(content.expiresAt, 'Should have expiresAt');

      const summary = content.summary as Record<string, number>;
      assert.strictEqual(typeof summary.total, 'number');
      assert.strictEqual(typeof summary.errors, 'number');
      assert.strictEqual(typeof summary.warnings, 'number');
      assert.strictEqual(typeof summary.suggestions, 'number');
    });

    test('extracts spec metadata', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');

      assert.strictEqual(content.specTitle, 'Acme Commerce API');
      assert.strictEqual(content.specVersion, '1.0.0');
    });
  });

  describe('Review with inline spec', () => {
    test('accepts inline YAML spec', async () => {
      const specContent = await readFile(TEST_SPEC, 'utf-8');

      const response = await client.callTool('baume-review', {
        spec: specContent,
        contentType: 'yaml',
      });

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content as JSON');
      assert.ok(content.reviewId, 'Should have reviewId');
      assert.ok(content.summary, 'Should have summary');
    });
  });

  describe('Resource linking', () => {
    test('returns resource_link to findings', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });

      const resourceLink = response.result?.content?.find(
        (c) => c.type === 'resource_link'
      );
      assert.ok(resourceLink, 'Should have resource_link content');
      assert.ok(resourceLink.uri, 'resource_link should have uri');
      assert.ok(
        resourceLink.uri?.startsWith('baume://findings?id='),
        'uri should be baume://findings?id={reviewId}'
      );
    });

    test('findings are accessible via resources/read', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });

      const content = client.parseTextContent(response);
      assert.ok(content?.reviewId, 'Should have reviewId');

      const resourceLink = response.result?.content?.find(
        (c) => c.type === 'resource_link'
      );
      assert.ok(resourceLink?.uri, 'Should have resource_link uri');

      const resourceResponse = await client.readResource(resourceLink!.uri!);

      assert.ok(!resourceResponse.error, 'Should successfully read resource');
      assert.ok(resourceResponse.result?.contents, 'Should have contents');

      const resourceContent = resourceResponse.result.contents[0];
      assert.ok(resourceContent, 'Should have resource content');

      const findings = JSON.parse(resourceContent.text || '{}');

      assert.ok(findings.findings, 'Should have findings array');
      assert.ok(Array.isArray(findings.findings), 'findings should be array');
    });
  });

  describe('Caching behavior', () => {
    test('same spec content produces same reviewId', async () => {
      const response1 = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });
      const response2 = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
      });

      const content1 = client.parseTextContent(response1);
      const content2 = client.parseTextContent(response2);

      assert.strictEqual(
        content1?.reviewId,
        content2?.reviewId,
        'Same spec should produce same reviewId'
      );
    });
  });

  describe('Filtering options', () => {
    test('filters by category', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
        categories: ['pagination'],
      });

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');

      // With category filter, should have fewer or equal findings
      const summary = content.summary as Record<string, number>;
      assert.ok(summary.total >= 0, 'Should have valid total');
    });

    test('skips specific rules', async () => {
      const response = await client.callTool('baume-review', {
        specPath: TEST_SPEC,
        skipRules: ['naming/plural-resources'],
      });

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');
    });
  });
});

describe('baume-list-rules HTTP E2E', () => {
  const client = new HttpMcpTestClient({ baseUrl: SERVER_URL });

  before(async () => {
    await waitForServer(SERVER_URL, { timeout: 60000, interval: 2000 });
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  test('lists all rules', async () => {
    const response = await client.callTool('baume-list-rules', {});

    assert.ok(!response.result?.isError, 'Should not be an error');

    const content = client.parseTextContent(response);
    assert.ok(content, 'Should parse content');
    assert.ok(Array.isArray(content.rules), 'Should have rules array');
    assert.ok((content.rules as unknown[]).length > 0, 'Should have rules');
  });

  test('filters by category', async () => {
    const response = await client.callTool('baume-list-rules', {
      category: 'pagination',
    });

    assert.ok(!response.result?.isError, 'Should not be an error');

    const content = client.parseTextContent(response);
    assert.ok(content, 'Should parse content');

    const rules = content.rules as Array<{ category: string }>;
    assert.ok(rules.length > 0, 'Should have pagination rules');
    assert.ok(
      rules.every((r) => r.category === 'pagination'),
      'All rules should be pagination category'
    );
  });
});

describe('Resources HTTP E2E', () => {
  const client = new HttpMcpTestClient({ baseUrl: SERVER_URL });

  before(async () => {
    await waitForServer(SERVER_URL, { timeout: 60000, interval: 2000 });
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  test('lists available resources', async () => {
    const response = await client.listResources();

    assert.ok(!response.error, 'Should not have error');
    assert.ok(response.result, 'Should have result');
  });

  test('lists available prompts', async () => {
    const response = await client.listPrompts();

    assert.ok(!response.error, 'Should not have error');
    assert.ok(response.result, 'Should have result');
  });
});
