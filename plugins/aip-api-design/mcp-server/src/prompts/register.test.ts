import { describe, it } from 'node:test';
import assert from 'node:assert';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type Prompt, McpError } from '@modelcontextprotocol/sdk/types.js';
import { registerPrompts } from './register.js';

describe('prompt registration', () => {
  it('should register prompts/list handler', async () => {
    const mcpServer = new McpServer(
      { name: 'test', version: '1.0.0' },
      {
        capabilities: { prompts: {} },
      }
    );
    registerPrompts(mcpServer.server);

    // @ts-expect-error: accessing private _requestHandlers Map
    const listHandler = mcpServer.server._requestHandlers.get('prompts/list');
    assert.ok(listHandler);

    const response = await listHandler({
      method: 'prompts/list',
      params: {},
    });

    assert.ok(response.prompts);
    assert.ok(response.prompts.length > 0);

    const codeLocator = response.prompts.find(
      (p: Prompt) => p.name === 'aip-code-locator'
    );
    assert.ok(codeLocator);
    assert.strictEqual(codeLocator.title, 'Find API Implementation');
    assert.ok(codeLocator.arguments);
    assert.ok(codeLocator.arguments.length >= 4);
  });

  it('should register prompts/get handler', async () => {
    const mcpServer = new McpServer(
      { name: 'test', version: '1.0.0' },
      {
        capabilities: { prompts: {} },
      }
    );
    registerPrompts(mcpServer.server);

    // @ts-expect-error: accessing private _requestHandlers Map
    const getHandler = mcpServer.server._requestHandlers.get('prompts/get');
    assert.ok(getHandler);

    const response = await getHandler({
      method: 'prompts/get',
      params: {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/test',
          projectRoot: '/path',
        },
      },
    });

    assert.ok(response.messages);
    assert.strictEqual(response.messages.length, 1);
    assert.strictEqual(response.messages[0].role, 'user');
  });

  it('should return error for unknown prompt', async () => {
    const mcpServer = new McpServer(
      { name: 'test', version: '1.0.0' },
      {
        capabilities: { prompts: {} },
      }
    );
    registerPrompts(mcpServer.server);

    // @ts-expect-error: accessing private _requestHandlers Map
    const getHandler = mcpServer.server._requestHandlers.get('prompts/get');
    assert.ok(getHandler);

    await assert.rejects(
      async () => {
        await getHandler({
          method: 'prompts/get',
          params: {
            name: 'unknown-prompt',
            arguments: {},
          },
        });
      },
      (error: McpError) => {
        assert.strictEqual(error.code, -32602);
        assert.ok(error.message.includes('Unknown prompt'));
        return true;
      }
    );
  });

  it('should validate prompt arguments', async () => {
    const mcpServer = new McpServer(
      { name: 'test', version: '1.0.0' },
      {
        capabilities: { prompts: {} },
      }
    );
    registerPrompts(mcpServer.server);

    // @ts-expect-error: accessing private _requestHandlers Map
    const getHandler = mcpServer.server._requestHandlers.get('prompts/get');
    assert.ok(getHandler);

    await assert.rejects(
      async () => {
        await getHandler({
          method: 'prompts/get',
          params: {
            name: 'aip-code-locator',
            arguments: {
              method: 'GET',
              path: '/test',
              // Missing required projectRoot
            },
          },
        });
      },
      (error: McpError) => {
        assert.strictEqual(error.code, -32602);
        assert.ok(error.message.includes('Invalid arguments'));
        return true;
      }
    );
  });
});
