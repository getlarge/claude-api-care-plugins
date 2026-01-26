import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Value } from '@sinclair/typebox/value';
import {
  codeLocatorPrompt,
  CodeLocatorArgsSchema,
  type CodeLocatorArgs,
} from './code-locator-prompt.js';

describe('code-locator-prompt', () => {
  describe('schema validation', () => {
    it('should validate valid arguments', () => {
      const args = {
        method: 'get',
        path: '/users/{id}',
        framework: 'nestjs' as const,
        projectRoot: '/path/to/project',
      };

      const errors = [...Value.Errors(CodeLocatorArgsSchema, args)];
      assert.strictEqual(errors.length, 0);
    });

    it('should apply defaults', () => {
      const args = {
        method: 'POST',
        path: '/orders',
        projectRoot: '/path/to/project',
      };

      const result = Value.Default(
        CodeLocatorArgsSchema,
        args
      ) as CodeLocatorArgs;
      assert.strictEqual(result.framework, 'unknown');
    });

    it('should reject invalid framework', () => {
      const args = {
        method: 'GET',
        path: '/users',
        framework: 'invalid-framework',
        projectRoot: '/path',
      };

      const errors = [...Value.Errors(CodeLocatorArgsSchema, args)];
      assert.ok(errors.length > 0);
    });

    it('should require projectRoot', () => {
      const args = {
        method: 'GET',
        path: '/users',
      };

      const errors = [...Value.Errors(CodeLocatorArgsSchema, args)];
      assert.ok(errors.length > 0);
    });
  });

  describe('handler execution', () => {
    it('should generate prompt messages', async () => {
      const result = await codeLocatorPrompt.handler.execute({
        method: 'GET',
        path: '/users/{id}',
        framework: 'nestjs',
        projectRoot: '/test/project',
      });

      assert.ok(result.messages);
      assert.strictEqual(result.messages.length, 1);
      assert.strictEqual(result.messages[0].role, 'user');
      assert.strictEqual(result.messages[0].content.type, 'text');
      assert.ok(result.messages[0].content.text.includes('GET'));
      assert.ok(result.messages[0].content.text.includes('/users/{id}'));
    });

    it('should include operationId when provided', async () => {
      const result = await codeLocatorPrompt.handler.execute({
        method: 'GET',
        path: '/users/{id}',
        framework: 'express',
        projectRoot: '/test',
        operationId: 'getUser',
      });

      const content = result.messages[0].content;
      if (content.type === 'text') {
        assert.ok(content.text.includes('getUser'));
      } else {
        assert.fail('Expected text content');
      }
    });

    it('should include description in result', async () => {
      const result = await codeLocatorPrompt.handler.execute({
        method: 'POST',
        path: '/orders',
        framework: 'fastify',
        projectRoot: '/test',
      });

      assert.ok(result.description);
      assert.ok(result.description.includes('POST'));
      assert.ok(result.description.includes('/orders'));
    });
  });
});
