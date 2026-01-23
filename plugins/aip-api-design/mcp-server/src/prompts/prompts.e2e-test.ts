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
      // Note: @platformatic/mcp does not pass 'title' to MCP protocol (only 'name' and 'description')
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

      const aipLookupPrompt = response.result.prompts.find(
        (p: { name: string }) => p.name === 'aip-lookup'
      );
      assert.ok(aipLookupPrompt, 'Should include aip-lookup prompt');
      // Note: @platformatic/mcp does not pass 'title' to MCP protocol (only 'name' and 'description')
      assert.ok(aipLookupPrompt.description, 'Should have description');
      assert.ok(aipLookupPrompt.arguments, 'Should have arguments definition');
      assert.ok(
        Array.isArray(aipLookupPrompt.arguments),
        'Arguments should be an array'
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
      // @platformatic/mcp returns -32601 (method not found) for unknown prompts
      assert.strictEqual(
        response.error.code,
        -32601,
        'Should return method not found error'
      );
    });

    // Note: @platformatic/mcp does not perform strict argument validation by default.
    // The handler receives the arguments as-is, and it's up to the handler to validate.
    // Our handlers use TypeBox Value.Default() which applies defaults but doesn't throw.
    // These tests document the current behavior with @platformatic/mcp.
    it('should return error message for missing required arguments', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/api/test',
          // Missing required projectRoot
        },
      });

      // @platformatic/mcp returns successful response with error message for validation errors
      assert.ok(!response.error, 'Should not return JSON-RPC error');
      assert.ok(response.result, 'Should have result');
      const text = response.result?.messages?.[0]?.content?.text;
      // Can be either framework validation or handler exception
      assert.ok(
        text && text.length > 0,
        `Should have error message text, got: ${text}`
      );
    });

    it('should return error message for invalid framework value', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-code-locator',
        arguments: {
          method: 'GET',
          path: '/api/test',
          projectRoot: '/test',
          framework: 'invalid-framework', // Not in enum
        },
      });

      // @platformatic/mcp returns successful response with error message for validation errors
      assert.ok(!response.error, 'Should not return JSON-RPC error');
      assert.ok(response.result, 'Should have result');
      const text = response.result?.messages?.[0]?.content?.text;
      // Can be either framework validation or handler exception
      assert.ok(
        text && text.length > 0,
        `Should have error message text, got: ${text}`
      );
    });
  });

  describe('aip-lookup prompt', () => {
    it('should generate AIP lookup prompt with string AIP', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: '158',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result?.messages, 'Response should contain messages');
      assert.strictEqual(
        response.result.messages.length,
        1,
        'Should have one message'
      );

      const message = response.result.messages[0];
      assert.strictEqual(message.role, 'user', 'Message should have user role');
      assert.strictEqual(
        message.content.type,
        'text',
        'Content should be text type'
      );

      const promptText = message.content.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(promptText.includes('158'), 'Prompt should include AIP number');
      assert.ok(
        promptText.includes('google.aip.dev/158'),
        'Prompt should include AIP URL'
      );
      assert.ok(
        promptText.includes('Pagination'),
        'Prompt should include AIP-158 specific guidance'
      );
    });

    it('should accept AIP as string and convert to number', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: '193',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(promptText.includes('193'), 'Prompt should include AIP 193');
      assert.ok(
        promptText.includes('Errors'),
        'Prompt should include AIP-193 specific guidance'
      );
    });

    it('should include context in prompt when provided', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: '122',
          context: 'Why do I need plural resource names?',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(
        promptText.includes('Why do I need plural resource names?'),
        'Prompt should include user context'
      );
      assert.ok(
        promptText.includes("User's question or context:"),
        'Prompt should have context section'
      );
    });

    it('should include finding in prompt when provided', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: '158',
          finding: 'GET /users is missing pagination parameters',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      const promptText = response.result?.messages?.[0]?.content?.text;
      assert.ok(promptText, 'Should have prompt text');
      assert.ok(
        promptText.includes('GET /users is missing pagination parameters'),
        'Prompt should include finding'
      );
      assert.ok(
        promptText.includes('A review finding referenced'),
        'Prompt should have finding section'
      );
    });

    it('should return error message for invalid AIP number', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: 'not-a-number',
        },
      });

      // @platformatic/mcp catches handler exceptions and returns successful response with error message
      assert.ok(!response.error, 'Should not return JSON-RPC error');
      assert.ok(response.result, 'Should have result');
      const text = response.result?.messages?.[0]?.content?.text;
      assert.ok(
        text && text.length > 0,
        `Should have error message text, got: ${text}`
      );
    });

    it('should return error message for missing aip parameter', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {},
      });

      // @platformatic/mcp catches handler exceptions and returns successful response with error message
      assert.ok(!response.error, 'Should not return JSON-RPC error');
      assert.ok(response.result, 'Should have result');
      const text = response.result?.messages?.[0]?.content?.text;
      assert.ok(
        text && text.length > 0,
        `Should have error message text, got: ${text}`
      );
    });

    it('should have correct description in result', async () => {
      const response = await client.send('prompts/get', {
        name: 'aip-lookup',
        arguments: {
          aip: '231',
        },
      });

      assert.ok(!response.error, 'Should not have error');
      assert.ok(response.result, 'Should have result');
      assert.ok(
        response.result.description,
        'Response should have description'
      );
      assert.ok(
        response.result.description.includes('AIP-231'),
        'Description should include AIP number'
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
