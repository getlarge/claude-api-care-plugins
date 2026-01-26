/**
 * E2E tests for rule discovery tools
 *
 * Tests baume-list-rules and baume-get-info tools via STDIO transport.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { McpTestClient } from '../test-helpers/mcp-client.js';

describe('Rule Discovery E2E', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('baume-list-rules', () => {
    test('returns list of available rules', async () => {
      const response = await client.callTool('baume-list-rules', {});

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');
      assert.ok(content.rules, 'Should have rules');
      assert.ok(Array.isArray(content.rules), 'rules should be array');
      assert.ok(
        (content.rules as unknown[]).length > 0,
        'Should have some rules'
      );
    });

    test('can filter rules by category', async () => {
      const response = await client.callTool('baume-list-rules', {
        category: 'pagination',
      });

      const content = client.parseTextContent(response);
      const rules = content?.rules as Array<{ category: string }>;

      assert.ok(rules.length > 0, 'Should have pagination rules');
      assert.ok(
        rules.every((r) => r.category === 'pagination'),
        'All rules should be pagination category'
      );
    });

    test('includes rule metadata', async () => {
      const response = await client.callTool('baume-list-rules', {});

      const content = client.parseTextContent(response);
      const rules = content?.rules as Array<{
        id: string;
        category: string;
        severity: string;
        description: string;
      }>;

      assert.ok(rules.length > 0, 'Should have rules');

      const firstRule = rules[0];
      assert.ok(firstRule.id, 'Rule should have id');
      assert.ok(firstRule.category, 'Rule should have category');
      assert.ok(firstRule.severity, 'Rule should have severity');
      assert.ok(firstRule.description, 'Rule should have description');
    });
  });

  describe('baume-get-info', () => {
    test('returns info for valid AIP number', async () => {
      const response = await client.callTool('baume-get-info', { aip: 158 });

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');
      assert.ok(content.aip, 'Should have aip number');
      assert.ok(content.title, 'Should have title');
      assert.ok(content.summary, 'Should have summary');
    });

    test('includes AIP metadata', async () => {
      const response = await client.callTool('baume-get-info', { aip: 193 });

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');

      // AIP field may be string or number format
      assert.ok(
        content.aip === 193 || content.aip === 'AIP-193',
        'Should be AIP 193'
      );
      assert.ok(content.url, 'Should have URL to AIP document');
      assert.ok(
        (content.url as string).includes('google.aip.dev'),
        'URL should point to google.aip.dev'
      );
    });

    test('handles well-known AIPs', async () => {
      const wellKnownAips = [122, 131, 132, 133, 134, 135, 158, 193];

      for (const aip of wellKnownAips) {
        const response = await client.callTool('baume-get-info', { aip });
        const content = client.parseTextContent(response);

        assert.ok(content, `AIP ${aip} should return content`);
        // AIP field may be string or number format
        assert.ok(
          content.aip === aip || content.aip === `AIP-${aip}`,
          `Should be AIP ${aip}`
        );
        assert.ok(content.title, `AIP ${aip} should have title`);
      }
    });
  });
});
