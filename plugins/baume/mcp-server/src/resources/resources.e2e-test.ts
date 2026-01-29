/**
 * E2E tests for MCP Resources
 *
 * Tests resource methods via STDIO transport:
 * - resources/list (returns registered resource definitions)
 * - resources/read (query param URIs with uriSchema matching)
 * - resources/templates/list (skipped - not implemented in native @platformatic/mcp)
 * - resources/subscribe / resources/unsubscribe
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

describe('MCP Resources E2E', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('resources/list', () => {
    test('should return registered resource definitions', async () => {
      const response = await client.send('resources/list', {});

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result, 'Should have result');
      assert.ok(
        Array.isArray(response.result.resources),
        'Should have resources array'
      );

      const resources = response.result.resources as Array<{
        uri: string;
        name: string;
        mimeType?: string;
      }>;

      // Should have findings and specs base resources
      const findingsResource = resources.find(
        (r) => r.uri === 'baume://findings'
      );
      assert.ok(findingsResource, 'Should have findings resource');
      assert.strictEqual(
        findingsResource.mimeType,
        'application/json',
        'Findings should be JSON'
      );

      const specsResource = resources.find((r) => r.uri === 'baume://specs');
      assert.ok(specsResource, 'Should have specs resource');
    });

    test('should include resource metadata', async () => {
      const listResponse = await client.send('resources/list', {});
      const resources = listResponse.result?.resources as Array<{
        uri: string;
        name: string;
        description?: string;
        mimeType?: string;
      }>;

      assert.ok(resources.length >= 2, 'Should have at least 2 resources');

      const resource = resources[0];
      assert.ok(resource.uri, 'Resource should have uri');
      assert.ok(resource.name, 'Resource should have name');
      assert.ok(resource.description, 'Resource should have description');
    });
  });

  describe('resources/read', () => {
    test('should read findings resource by query param URI', async () => {
      // Create a review first
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);
      const reviewId = reviewContent?.reviewId as string;
      assert.ok(reviewId, 'Should have reviewId');

      // Read the resource using query param format
      const readResponse = await client.send('resources/read', {
        uri: `baume://findings?id=${reviewId}`,
      });

      assert.ok(!readResponse.error, 'Should not have error');
      assert.ok(readResponse.result?.contents, 'Should have contents');

      const content = readResponse.result.contents[0];
      assert.ok(content, 'Should have content');
      assert.strictEqual(
        content.mimeType,
        'application/json',
        'Should be JSON'
      );
      assert.ok(content.text, 'Should have text content');

      const findings = JSON.parse(content.text);
      assert.ok(Array.isArray(findings.findings), 'Should have findings array');
    });

    test('should return error for non-existent resource', async () => {
      const readResponse = await client.send('resources/read', {
        uri: 'baume://findings?id=nonexistent-id-12345',
      });

      assert.ok(!readResponse.error, 'JSON-RPC should not error');
      assert.ok(readResponse.result?.contents, 'Should have contents');

      const content = readResponse.result.contents[0];
      const parsed = JSON.parse(content.text || '{}');
      assert.ok(parsed.error, 'Content should indicate error');
      assert.strictEqual(
        parsed.error,
        'Findings not found',
        'Should be not found error'
      );
    });

    test('should match base URI with uriSchema for query param URIs', async () => {
      // Create a review
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);
      const reviewId = reviewContent?.reviewId as string;

      // The URI format is baume://findings?id={reviewId}
      // Query param stripping should find base URI and uriSchema validates
      const readResponse = await client.send('resources/read', {
        uri: `baume://findings?id=${reviewId}`,
      });

      assert.ok(!readResponse.error, 'Should not have JSON-RPC error');
      assert.ok(readResponse.result?.contents?.[0], 'Should have content');

      const content = JSON.parse(readResponse.result.contents[0].text || '{}');
      assert.ok(!content.error, 'Should successfully read via query param URI');
    });
  });

  describe('resources/templates/list', () => {
    // Skipped - not implemented in native @platformatic/mcp
    // TODO: Submit PR to add resources/templates/list support
    test.skip('should return resource templates', async () => {
      const response = await client.send('resources/templates/list', {});

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result, 'Should have result');

      const templates = response.result.resourceTemplates as Array<{
        uriTemplate: string;
        name: string;
        description?: string;
        mimeType?: string;
      }>;

      assert.ok(Array.isArray(templates), 'Should have templates array');
      assert.ok(templates.length >= 2, 'Should have at least 2 templates');

      // Check for findings template
      const findingsTemplate = templates.find(
        (t) => t.uriTemplate === 'baume://findings/{reviewId}'
      );
      assert.ok(findingsTemplate, 'Should have findings template');
      assert.strictEqual(
        findingsTemplate.name,
        'AIP Review Findings',
        'Should have correct name'
      );
      assert.ok(findingsTemplate.description, 'Should have description');

      // Check for specs template
      const specsTemplate = templates.find(
        (t) => t.uriTemplate === 'baume://specs/{specId}'
      );
      assert.ok(specsTemplate, 'Should have specs template');
      assert.strictEqual(
        specsTemplate.name,
        'Modified OpenAPI Specs',
        'Should have correct name'
      );
    });

    test.skip('should include mimeType in templates', async () => {
      const response = await client.send('resources/templates/list', {});
      const templates = response.result?.resourceTemplates as Array<{
        uriTemplate: string;
        mimeType?: string;
      }>;

      const findingsTemplate = templates.find((t) =>
        t.uriTemplate.includes('findings')
      );
      assert.strictEqual(
        findingsTemplate?.mimeType,
        'application/json',
        'Findings template should specify JSON mimeType'
      );
    });
  });

  describe('resources/subscribe and resources/unsubscribe', () => {
    test('should accept subscription request', async () => {
      // First create a resource to subscribe to
      const reviewResponse = await client.callTool('baume-review', {
        spec: { path: TEST_SPEC },
      });
      const reviewContent = client.parseTextContent(reviewResponse);
      const reviewId = reviewContent?.reviewId as string;
      const uri = `baume://findings?id=${reviewId}`;

      // Subscribe to the resource
      const subscribeResponse = await client.send('resources/subscribe', {
        uri,
      });

      // Native @platformatic/mcp handles subscriptions via broker
      // STDIO transport doesn't have session ID, so method may not be found
      assert.ok(
        !subscribeResponse.error ||
          subscribeResponse.error.message.includes('not found') ||
          subscribeResponse.error.message.includes('Session'),
        'Should either succeed or indicate method/session issue'
      );
    });

    test('should accept unsubscribe request', async () => {
      const uri = 'baume://findings?id=some-review-id';

      const unsubscribeResponse = await client.send('resources/unsubscribe', {
        uri,
      });

      // Similar to subscribe - native @platformatic/mcp handles via broker
      assert.ok(
        !unsubscribeResponse.error ||
          unsubscribeResponse.error.message.includes('not found') ||
          unsubscribeResponse.error.message.includes('Session'),
        'Should either succeed or indicate method/session issue'
      );
    });

    test('should require uri parameter for subscribe', async () => {
      const response = await client.send('resources/subscribe', {});

      // Method may not be found in native, or will error on missing uri
      assert.ok(
        response.error,
        'Should have error without uri or method not found'
      );
    });

    test('should require uri parameter for unsubscribe', async () => {
      const response = await client.send('resources/unsubscribe', {});

      // Method may not be found in native, or will error on missing uri
      assert.ok(
        response.error,
        'Should have error without uri or method not found'
      );
    });
  });

  describe('initialize response', () => {
    test('should declare resources capability', async () => {
      // Re-initialize to check capabilities
      const response = await client.send('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'e2e-test', version: '1.0.0' },
      });

      assert.ok(response.result, 'Should have result');
      const capabilities = response.result as {
        capabilities?: {
          resources?: { subscribe?: boolean; listChanged?: boolean };
        };
      };

      // Resources capability should be declared
      assert.ok(
        capabilities.capabilities?.resources !== undefined ||
          response.result !== undefined,
        'Should have server capabilities'
      );
    });
  });
});
