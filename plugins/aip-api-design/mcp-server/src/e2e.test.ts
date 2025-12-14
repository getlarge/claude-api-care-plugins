/**
 * End-to-End Tests for MCP Server
 *
 * Tests the MCP server tools via STDIO transport.
 * Run with: npm test or node --test src/e2e.test.ts
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const FIXTURES_DIR = join(
  __dirname,
  '..',
  '..',
  'openapi-reviewer',
  'tests',
  'fixtures'
);
const TEST_SPEC = join(FIXTURES_DIR, 'acme-commerce.yaml');

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    content?: Array<{ type: string; text?: string; uri?: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
  error?: { code: number; message: string };
}

/**
 * MCP Test Client - manages a server process and provides helpers for testing
 */
class McpTestClient {
  private server: ChildProcess | null = null;
  private readline: Interface | null = null;
  private msgId = 0;
  private pending = new Map<
    number,
    { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }
  >();

  async start(): Promise<void> {
    this.server = spawn('node', [join(DIST_DIR, 'stdio.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.readline = createInterface({ input: this.server.stdout! });

    this.readline.on('line', (line) => {
      try {
        const msg = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pending.get(msg.id);
        if (pending) {
          this.pending.delete(msg.id);
          pending.resolve(msg);
        }
      } catch {
        // Ignore non-JSON lines (e.g., worker pool logs)
      }
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Initialize MCP session
    await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-test', version: '1.0.0' },
    });
  }

  async stop(): Promise<void> {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
    this.pending.clear();
  }

  async send(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<JsonRpcResponse> {
    if (!this.server?.stdin) {
      throw new Error('Server not started');
    }

    const id = ++this.msgId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }, 30000);

      this.pending.set(id, {
        resolve: (r) => {
          clearTimeout(timeout);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });

      this.server!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    return this.send('tools/call', { name, arguments: args });
  }

  /**
   * Parse the text content from a tool response
   */
  parseTextContent(response: JsonRpcResponse): Record<string, unknown> | null {
    const textContent = response.result?.content?.find(
      (c) => c.type === 'text'
    );
    if (!textContent?.text) return null;
    try {
      return JSON.parse(textContent.text);
    } catch {
      return null;
    }
  }
}

describe('MCP Server E2E Tests', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('aip-review', () => {
    test('returns compact response with reviewId and summary', async () => {
      const response = await client.callTool('aip-review', {
        specPath: TEST_SPEC,
      });

      assert.ok(!response.result?.isError, 'Should not be an error');
      assert.ok(response.result?.content, 'Should have content');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content as JSON');

      // Check compact response fields
      assert.ok(content.reviewId, 'Should have reviewId');
      assert.ok(content.specPath, 'Should have specPath');
      assert.ok(content.summary, 'Should have summary');
      assert.ok(content.findingsPath, 'Should have findingsPath (STDIO mode)');
      assert.ok(content.expiresAt, 'Should have expiresAt');

      // Check summary structure
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

      // Check specTitle and specVersion are extracted
      assert.strictEqual(content.specTitle, 'Acme Commerce API');
      assert.strictEqual(content.specVersion, '1.0.0');
    });

    test('findings file is accessible and contains full data', async () => {
      const response = await client.callTool('aip-review', {
        specPath: TEST_SPEC,
      });

      const content = client.parseTextContent(response);
      assert.ok(content?.findingsPath, 'Should have findingsPath');

      // Read the findings file
      const findingsJson = await readFile(
        content.findingsPath as string,
        'utf-8'
      );
      const findings = JSON.parse(findingsJson);

      assert.ok(findings.findings, 'Should have findings array');
      assert.ok(Array.isArray(findings.findings), 'findings should be array');
      assert.ok(findings.findings.length > 0, 'Should have some findings');

      // Check finding structure
      const firstFinding = findings.findings[0];
      assert.ok(firstFinding.ruleId, 'Finding should have ruleId');
      assert.ok(firstFinding.severity, 'Finding should have severity');
      assert.ok(firstFinding.message, 'Finding should have message');
    });

    test('returns resource_link to findings file', async () => {
      const response = await client.callTool('aip-review', {
        specPath: TEST_SPEC,
      });

      const resourceLink = response.result?.content?.find(
        (c) => c.type === 'resource_link'
      );
      assert.ok(resourceLink, 'Should have resource_link content');
      assert.ok(resourceLink.uri, 'resource_link should have uri');
      assert.ok(
        resourceLink.uri?.startsWith('file://'),
        'uri should be file:// URL'
      );
    });

    test('same spec content produces same reviewId', async () => {
      const response1 = await client.callTool('aip-review', {
        specPath: TEST_SPEC,
      });
      const response2 = await client.callTool('aip-review', {
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

  describe('aip-list-rules', () => {
    test('returns list of available rules', async () => {
      const response = await client.callTool('aip-list-rules', {});

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
      const response = await client.callTool('aip-list-rules', {
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
  });

  describe('aip-get-info', () => {
    test('returns info for valid AIP number', async () => {
      const response = await client.callTool('aip-get-info', { aip: 158 });

      assert.ok(!response.result?.isError, 'Should not be an error');

      const content = client.parseTextContent(response);
      assert.ok(content, 'Should parse content');
      assert.ok(content.aip, 'Should have aip number');
      assert.ok(content.title, 'Should have title');
      assert.ok(content.summary, 'Should have summary');
    });
  });

  describe('aip-apply-fixes', () => {
    test('can retrieve findings by reviewId and apply fixes (dry run)', async () => {
      // First, run a review to get the reviewId
      const reviewResponse = await client.callTool('aip-review', {
        specPath: TEST_SPEC,
      });

      const reviewContent = client.parseTextContent(reviewResponse);
      assert.ok(reviewContent?.reviewId, 'Should have reviewId from review');

      // Now call apply-fixes with reviewId
      const fixResponse = await client.callTool('aip-apply-fixes', {
        specPath: TEST_SPEC,
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
      assert.ok(fixContent?.summary, 'Should have summary');
    });

    test('reports error for invalid reviewId', async () => {
      const response = await client.callTool('aip-apply-fixes', {
        specPath: TEST_SPEC,
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
});
