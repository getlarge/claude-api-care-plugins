/**
 * E2E tests for baume-apply-fixes tool
 *
 * Tests fix application via STDIO transport, including dry-run mode,
 * reviewId caching, and error handling.
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

describe('baume-apply-fixes E2E', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('ReviewId caching', () => {
    test('can retrieve findings by reviewId and apply fixes (dry run)', async () => {
      // First, run a review to get the reviewId
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });

      const reviewContent = client.parseTextContent(reviewResponse);
      assert.ok(reviewContent?.reviewId, 'Should have reviewId from review');

      // Now call apply-fixes with reviewId
      const fixResponse = await client.callTool('baume-apply-fixes', {
        spec: { path: TEST_SPEC },
        reviewId: reviewContent.reviewId,
        dryRun: true,
      });

      // Check response
      assert.ok(!fixResponse.error, 'Should not have RPC error');

      const fixContent = client.parseTextContent(fixResponse);

      // If there's an error about findings not found, that's a bug
      if (fixContent?.error) {
        assert.fail(`apply-fixes failed: ${fixContent.error}`);
      }

      // Check structured output
      assert.ok(fixContent?.results, 'Should have results array');
      assert.ok(Array.isArray(fixContent.results), 'results should be array');
      assert.ok(fixContent?.summary, 'Should have summary');
    });

    test('reports error for invalid reviewId', async () => {
      const response = await client.callTool('baume-apply-fixes', {
        spec: { path: TEST_SPEC },
        reviewId: 'nonexistent-id',
        dryRun: true,
      });

      const content = client.parseTextContent(response);
      assert.ok(content?.error, 'Should have error for invalid reviewId');
      assert.ok(
        (content.error as string).includes('No cached findings'),
        'Error should mention cached findings'
      );
    });
  });

  describe('Fix summary', () => {
    test('provides accurate summary statistics', async () => {
      // Get reviewId first
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);

      // Apply fixes
      const fixResponse = await client.callTool('baume-apply-fixes', {
        spec: { path: TEST_SPEC },
        reviewId: reviewContent?.reviewId,
        dryRun: true,
      });

      const fixContent = client.parseTextContent(fixResponse);

      // Verify summary structure matches library output
      const summary = fixContent?.summary as Record<string, number>;
      assert.strictEqual(
        typeof summary.total,
        'number',
        'summary.total should be number'
      );
      assert.strictEqual(
        typeof summary.applied,
        'number',
        'summary.applied should be number'
      );
      assert.strictEqual(
        typeof summary.failed,
        'number',
        'summary.failed should be number'
      );
      assert.strictEqual(
        typeof summary.changes,
        'number',
        'summary.changes should be number'
      );
    });

    test('includes detailed fix results', async () => {
      // Get reviewId first
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);

      // Apply fixes
      const fixResponse = await client.callTool('baume-apply-fixes', {
        spec: { path: TEST_SPEC },
        reviewId: reviewContent?.reviewId,
        dryRun: true,
      });

      const fixContent = client.parseTextContent(fixResponse);

      // If there are results, verify structure matches library FixResult
      const results = fixContent?.results as unknown[];
      if (results && results.length > 0) {
        const firstResult = results[0] as Record<string, unknown>;
        assert.ok(firstResult.ruleId, 'FixResult should have ruleId');
        assert.strictEqual(
          typeof firstResult.applied,
          'boolean',
          'FixResult.applied should be boolean'
        );
        assert.ok(
          Array.isArray(firstResult.changes),
          'FixResult.changes should be array'
        );
      }
    });
  });

  describe('Modified spec output', () => {
    test('returns resource link to modified spec', async () => {
      // Get reviewId first
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);

      // Apply fixes
      const fixResponse = await client.callTool('baume-apply-fixes', {
        spec: { path: TEST_SPEC },
        reviewId: reviewContent?.reviewId,
        dryRun: true,
      });

      // Verify resource link to modified spec
      const resourceLink = fixResponse.result?.content?.find(
        (c) => c.type === 'resource_link'
      );
      assert.ok(resourceLink, 'Should have resource_link to modified spec');
      assert.ok(resourceLink.uri, 'resource_link should have uri');
      assert.ok(
        resourceLink.uri?.startsWith('baume://specs?id='),
        'uri should be baume://specs?id={specId}'
      );
    });
  });
});
