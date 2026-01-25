import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Fastify, { type FastifyInstance } from 'fastify';
import mcpPlugin from '@getlarge/fastify-mcp';
import { registerAipPrompts, PROMPTS } from './register.js';

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
    registerAipPrompts(fastify);
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('should export PROMPTS registry', () => {
    assert.ok(Array.isArray(PROMPTS));
    assert.strictEqual(PROMPTS.length, 2);
  });

  it('should have code locator prompt in registry', () => {
    const codeLocator = PROMPTS.find((p) => p.name === 'aip-code-locator');
    assert.ok(codeLocator);
    assert.strictEqual(codeLocator.title, 'Find API Implementation');
    assert.ok(codeLocator.argsSchema);
  });

  it('should have aip lookup prompt in registry', () => {
    const aipLookup = PROMPTS.find((p) => p.name === 'aip-lookup');
    assert.ok(aipLookup);
    assert.strictEqual(aipLookup.title, 'Fetch and Explain AIP');
    assert.ok(aipLookup.argsSchema);
  });

  it('should execute code locator prompt handler', async () => {
    const codeLocator = PROMPTS.find((p) => p.name === 'aip-code-locator');
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

  it('should execute aip lookup prompt handler', async () => {
    const aipLookup = PROMPTS.find((p) => p.name === 'aip-lookup');
    assert.ok(aipLookup);

    const result = await aipLookup.handler.execute({
      aip: '158',
    });

    assert.ok(result.messages);
    assert.strictEqual(result.messages.length, 1);
    assert.strictEqual(result.messages[0].role, 'user');
    assert.ok(result.description?.includes('AIP-158'));
  });
});
