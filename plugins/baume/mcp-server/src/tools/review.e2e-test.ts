/**
 * E2E tests for baume-review tool
 *
 * Tests the review tool via STDIO transport, including compact response format,
 * resource linking, and caching behavior.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { McpTestClient } from '../test-helpers/mcp-client.js';

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

describe('baume-review E2E', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('Compact response format', () => {
    test('returns reviewId and summary', async () => {
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

      // Verify total is sum of components
      assert.strictEqual(
        summary.total,
        summary.errors + summary.warnings + summary.suggestions
      );
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
      assert.strictEqual(
        resourceLink.mimeType,
        'application/json',
        'Should be JSON mime type'
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
      assert.ok(resourceLink, 'Should have resource_link');
      assert.ok(resourceLink.uri, 'resource_link should have uri');

      const resourceResponse = await client.send('resources/read', {
        uri: resourceLink.uri,
      });

      assert.ok(!resourceResponse.error, 'Should successfully read resource');
      assert.ok(resourceResponse.result?.contents, 'Should have contents');

      const resourceContent = resourceResponse.result.contents[0];
      assert.ok(resourceContent, 'Should have resource content');

      const findings = JSON.parse(
        resourceContent.text || resourceContent.blob || '{}'
      );

      assert.ok(findings.findings, 'Should have findings array');
      assert.ok(Array.isArray(findings.findings), 'findings should be array');
      assert.ok(findings.findings.length > 0, 'Should have some findings');

      const firstFinding = findings.findings[0];
      assert.ok(firstFinding.ruleId, 'Finding should have ruleId');
      assert.ok(firstFinding.severity, 'Finding should have severity');
      assert.ok(firstFinding.message, 'Finding should have message');
    });
  });

  describe('Caching and deduplication', () => {
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
});
