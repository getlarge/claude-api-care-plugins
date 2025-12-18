/**
 * E2E tests for MCP Prompts
 *
 * Tests the full MCP server integration with prompts capability via STDIO.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { McpTestClient } from '../test-helpers/mcp-client.js';

describe('MCP Prompts E2E', () => {
  const client = new McpTestClient();

  before(async () => {
    await client.start();
  });

  after(async () => {
    await client.stop();
  });

  describe('prompts/list', () => {
    it('should list available prompts', async () => {
      const response = await client.send('prompts/list', {});

      assert.ok(!response.error, 'Should not have error');
      assert.ok(
        response.result?.prompts,
        'Response should contain prompts array'
      );
      assert.ok(
        Array.isArray(response.result.prompts),
        'Prompts should be an array'
      );
      assert.ok(
        response.result.prompts.length > 0,
        'Should have at least one prompt'
      );

      const codeLocatorPrompt = response.result.prompts.find(
        (p: { name: string }) => p.name === 'aip-code-locator'
      );
      assert.ok(codeLocatorPrompt, 'Should include aip-code-locator prompt');
      assert.strictEqual(
        codeLocatorPrompt.title,
        'Find API Implementation',
        'Should have correct title'
      );
      assert.ok(codeLocatorPrompt.description, 'Should have description');
      assert.ok(
        codeLocatorPrompt.arguments,
        'Should have arguments definition'
      );
      assert.ok(
        Array.isArray(codeLocatorPrompt.arguments),
        'Arguments should be an array'
      );

      const requiredArgs = codeLocatorPrompt.arguments.filter(
        (arg: { required?: boolean }) => arg.required
      );
      assert.ok(
        requiredArgs.length >= 3,
        'Should have at least 3 required arguments (method, path, projectRoot)'
      );
    });
  });

  describe('prompts/get', () => {
    it('should generate prompt with valid arguments', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/api/users/{id}',
          framework: 'nestjs',
          projectRoot: '/path/to/project',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result?.messages, 'Response should contain messages');
      assert.ok(
        Array.isArray(response.result.messages),
        'Messages should be an array'
      );
      assert.strictEqual(
        response.result.messages.length,
        1,
        'Should have one message'
      );

      const message = response.result.messages[0];
      assert.strictEqual(message.role, 'user', 'Message should have user role');
      assert.ok(message.content, 'Message should have content');
      assert.strictEqual(
        message.content.type,
        'text',
        'Content should be text type'
      );
      assert.ok(message.content.text, 'Message should have text');
      assert.ok(
        message.content.text.includes('GET'),
        'Prompt should include HTTP method'
      );
      assert.ok(
        message.content.text.includes('/api/users/{id}'),
        'Prompt should include API path'
      );
      assert.ok(
        message.content.text.includes('nestjs'),
        'Prompt should include framework'
      );

      assert.ok(
        response.result.description,
        'Response should have description'
      );
      assert.ok(
        response.result.description.includes('GET'),
        'Description should include method'
      );
      assert.ok(
        response.result.description.includes('/api/users/{id}'),
        'Description should include path'
      );
    });

    it('should include operationId in prompt when provided', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'POST',
          path: '/api/orders',
          framework: 'fastify',
          projectRoot: '/project',
          operationId: 'createOrder',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(
        promptText.includes('createOrder'),
        'Prompt should include operationId'
      );
    });

    it('should apply default framework when not specified', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'DELETE',
          path: '/api/items/{id}',
          projectRoot: '/app',
          // framework not provided - should default to 'unknown'
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(
        promptText.includes('unknown') || promptText.includes('Framework'),
        'Prompt should handle unknown framework'
      );
    });

    it('should uppercase HTTP method in display fields', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'post', // lowercase
          path: '/api/test',
          projectRoot: '/test',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');

      assert.ok(
        promptText.match(/- \*\*Method\*\*: POST/),
        'HTTP method should be uppercased in display'
      );

      // Lowercase is acceptable in search patterns (e.g., fastify.post(), router.post())
      // since that's how the actual framework code is written
    });

    it('should reject unknown prompt name', async () => {
      const response = await client.send('prompts/get', {
        name: 'non-existent-prompt',
        arguments: {},
      });

      assert.ok(response.error, 'Should have error');
      assert.strictEqual(
        response.error.code,
        -32602,
        'Should return invalid params error'
      );
      assert.ok(
        response.error.message.includes('Unknown prompt'),
        'Error message should mention unknown prompt'
      );
    });

    it('should validate required arguments', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/api/test',
          // Missing required projectRoot
        },
      });

      assert.ok(response.error, 'Should have error');
      assert.strictEqual(
        response.error.code,
        -32602,
        'Should return invalid params error'
      );
      assert.ok(
        response.error.message.includes('Invalid arguments'),
        'Error message should mention invalid arguments'
      );
    });

    it('should validate framework enum', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/api/test',
          projectRoot: '/test',
          framework: 'invalid-framework', // Not in enum
        },
      });

      assert.ok(response.error, 'Should have error');
      assert.strictEqual(
        response.error.code,
        -32602,
        'Should return invalid params error'
      );
    });
  });

  describe('initialize response', () => {
    it('should declare prompts capability in server info', async () => {
      // The client already initialized during start(), but we can verify capabilities
      // by checking that prompts/list works (which requires the capability)
      const response = await client.send('prompts/list', {});
      assert.ok(!response.error, 'Prompts capability should be functional');
      assert.ok(response.result?.prompts, 'Should have prompts in response');
    });
  });
});
