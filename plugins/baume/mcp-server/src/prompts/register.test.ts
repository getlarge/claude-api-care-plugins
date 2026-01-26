import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Fastify, { type FastifyInstance } from 'fastify';
import mcpPlugin from '@getlarge/fastify-mcp';
import { registerBaumePrompts, PROMPTS } from './register.js';

describe('prompt registration', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });

    // Register MCP plugin first
    await fastify.register(mcpPlugin, {
      serverInfo: {
        name: 'test',
        version: '1.0.0',
      },
      capabilities: {
        prompts: {},
      },
    });

    // Then register our prompts
    registerBaumePrompts(fastify);
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('should export PROMPTS registry', () => {
    assert.ok(Array.isArray(PROMPTS));
    assert.strictEqual(PROMPTS.length, 2);
  });

  it('should have code locator prompt in registry', () => {
    const codeLocator = PROMPTS.find((p) => p.name === 'baume-code-locator');
    assert.ok(codeLocator);
    assert.strictEqual(codeLocator.title, 'Find API Implementation');
    assert.ok(codeLocator.argsSchema);
  });

  it('should have baume lookup prompt in registry', () => {
    const baumeLookup = PROMPTS.find((p) => p.name === 'baume-lookup');
    assert.ok(baumeLookup);
    assert.strictEqual(baumeLookup.title, 'Fetch and Explain AIP');
    assert.ok(baumeLookup.argsSchema);
  });

  it('should execute code locator prompt handler', async () => {
    const codeLocator = PROMPTS.find((p) => p.name === 'baume-code-locator');
    assert.ok(codeLocator);

    const result = await codeLocator.handler.execute({
      method: 'GET',
      path: '/test',
      projectRoot: '/path',
    });

    assert.ok(result.messages);
    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(result.messages[0].role, 'user');
  });

  it('should execute baume lookup prompt handler', async () => {
    const baumeLookup = PROMPTS.find((p) => p.name === 'baume-lookup');
    assert.ok(baumeLookup);

    const result = await baumeLookup.handler.execute({
      aip: '158',
    });

    assert.ok(result.messages);
    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(result.messages[0].role, 'user');
    assert.ok(result.description?.includes('AIP-158'));
  });
});
