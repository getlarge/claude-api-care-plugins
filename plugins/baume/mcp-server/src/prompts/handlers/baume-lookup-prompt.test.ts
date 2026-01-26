import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Value } from '@sinclair/typebox/value';
import { aipLookupPrompt, AipLookupArgsSchema } from './baume-lookup-prompt.js';

describe('baume-lookup-prompt', () => {
  describe('schema validation', () => {
    it('should validate AIP number as string', () => {
      const args = { aip: '158' };
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];
      assert.strictEqual(errors.length, 0);
    });

    it('should accept numeric string', () => {
      const args = { aip: '193' };
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];
      assert.strictEqual(errors.length, 0);
    });

    it('should accept optional context', () => {
      const args = {
        aip: '122',
        context: 'Why do I need plural resource names?',
      };
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];
      assert.strictEqual(errors.length, 0);
    });

    it('should accept optional finding', () => {
      const args = {
        aip: '158',
        finding: 'GET /users is missing pagination parameters',
      };
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];
      assert.strictEqual(errors.length, 0);
    });

    it('should require aip parameter', () => {
      const args = {};
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];
      assert.ok(errors.length > 0);
    });
  });

  describe('handler execution', () => {
    it('should generate prompt messages for basic AIP lookup', async () => {
      const result = await aipLookupPrompt.handler.execute({ aip: '122' });

      assert.ok(result.messages);
      assert.strictEqual(result.messages.length, 1);
      assert.strictEqual(result.messages[0].role, 'user');
      assert.strictEqual(result.messages[0].content.type, 'text');

      const content = result.messages[0].content;
      if (content.type === 'text') {
        assert.ok(content.text.includes('122'));
        assert.ok(content.text.includes('google.aip.dev/122'));
      } else {
        assert.fail('Expected text content');
      }
    });

    it('should reject invalid AIP number in schema', () => {
      const args = { aip: 'invalid' };
      const errors = [...Value.Errors(AipLookupArgsSchema, args)];

      // TypeBox pattern validation should catch non-numeric strings
      assert.ok(errors.length > 0, 'Should have validation errors');
      assert.ok(
        errors.some((e) => e.path === '/aip'),
        'Error should be for aip field'
      );
    });

    it('should include context when provided', async () => {
      const result = await aipLookupPrompt.handler.execute({
        aip: '158',
        context: 'How should I implement pagination?',
      });

      const content = result.messages[0].content;
      if (content.type === 'text') {
        assert.ok(content.text.includes('How should I implement pagination?'));
        assert.ok(content.text.includes("User's question or context:"));
      } else {
        assert.fail('Expected text content');
      }
    });

    it('should include finding when provided', async () => {
      const result = await aipLookupPrompt.handler.execute({
        aip: '193',
        finding: 'Error responses should use standard error schema',
      });

      const content = result.messages[0].content;
      if (content.type === 'text') {
        assert.ok(
          content.text.includes(
            'Error responses should use standard error schema'
          )
        );
        assert.ok(content.text.includes('A review finding referenced'));
      } else {
        assert.fail('Expected text content');
      }
    });

    it('should include both context and finding', async () => {
      const result = await aipLookupPrompt.handler.execute({
        aip: '134',
        context: 'What are field masks?',
        finding: 'PATCH operation should support field masks',
      });

      const content = result.messages[0].content;
      if (content.type === 'text') {
        assert.ok(content.text.includes('What are field masks?'));
        assert.ok(
          content.text.includes('PATCH operation should support field masks')
        );
      } else {
        assert.fail('Expected text content');
      }
    });

    it('should include description in result', async () => {
      const result = await aipLookupPrompt.handler.execute({ aip: '158' });

      assert.ok(result.description);
      assert.ok(result.description.includes('AIP-158'));
    });

    it('should include specific guidance for known AIPs', async () => {
      const knownAips = ['122', '158', '193', '231'];

      for (const aip of knownAips) {
        const result = await aipLookupPrompt.handler.execute({ aip });
        const content = result.messages[0].content;

        if (content.type === 'text') {
          assert.ok(
            content.text.includes(`**AIP-${aip}**`),
            `Should include guidance for AIP-${aip}`
          );
        } else {
          assert.fail('Expected text content');
        }
      }
    });
  });

  describe('prompt metadata', () => {
    it('should have correct name', () => {
      assert.strictEqual(aipLookupPrompt.name, 'baume-lookup');
    });

    it('should have title and description', () => {
      assert.ok(aipLookupPrompt.title);
      assert.ok(aipLookupPrompt.description);
    });

    it('should have argsSchema', () => {
      assert.ok(aipLookupPrompt.argsSchema);
      assert.strictEqual(aipLookupPrompt.argsSchema, AipLookupArgsSchema);
    });
  });
});
