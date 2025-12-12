/**
 * Tests for Machine-Readable Fix Objects
 * Run with: node --test src/fix.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenAPIReviewer } from './reviewer.js';

/**
 * @typedef {import('./types.ts').Fix} Fix
 * @typedef {import('./types.ts').FixType} FixType
 */

/**
 * Validate fix structure
 * @param {Fix | undefined} fix
 * @param {FixType} expectedType
 */
function assertValidFix(fix, expectedType) {
  assert.ok(fix, 'Fix should be defined');
  assert.equal(fix.type, expectedType, `Fix type should be ${expectedType}`);
  assert.ok(fix.jsonPath.startsWith('$'), 'JSONPath should start with $');
  assert.ok(Array.isArray(fix.specChanges), 'specChanges should be an array');
  assert.ok(fix.specChanges.length > 0, 'specChanges should not be empty');

  // Validate each spec change
  for (const change of fix.specChanges) {
    assert.ok(change.operation, 'Spec change should have operation');
    assert.ok(
      change.path.startsWith('$'),
      'Spec change path should start with $'
    );
  }
}

describe('Fix objects', () => {
  describe('All findings have well-formed fix objects', () => {
    it('should produce fix objects for all findings', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/user/{id}': {
            get: {
              operationId: 'getUser',
              requestBody: { content: { 'application/json': {} } },
              responses: { 200: { description: 'OK' } },
            },
            put: {
              operationId: 'updateUser',
              responses: { 200: { description: 'OK' } },
            },
          },
          '/users': {
            get: {
              operationId: 'listUsers',
              responses: {
                200: {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
            post: {
              operationId: 'createUser',
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer().review(spec);

      assert.ok(result.findings.length > 0, 'Should have findings');

      for (const finding of result.findings) {
        assert.ok(
          finding.fix,
          `Finding ${finding.ruleId} should have fix object`
        );
        assert.ok(finding.fix.type, 'Fix should have type');
        assert.ok(finding.fix.jsonPath, 'Fix should have jsonPath');
        assert.ok(
          Array.isArray(finding.fix.specChanges),
          'Fix should have specChanges array'
        );
      }
    });
  });

  describe('rename-path-segment fixes', () => {
    it('should produce correct fix for singular resource names', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/user/{id}': {
            get: { responses: { 200: { description: 'OK' } } },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip131/get-no-body',
          'aip158/list-paginated',
          'aip193/schema-defined',
          'aip193/responses-documented',
        ],
      }).review(spec);

      const pluralFinding = result.findings.find(
        (f) => f.ruleId === 'aip122/plural-resources'
      );

      assert.ok(pluralFinding, 'Should have plural-resources finding');
      assertValidFix(pluralFinding.fix, 'rename-path-segment');
      assert.equal(pluralFinding.fix?.replacement, 'users');
      assert.equal(pluralFinding.fix?.specChanges[0].from, '/user/{id}');
      assert.equal(pluralFinding.fix?.specChanges[0].to, '/users/{id}');
    });
  });

  describe('add-parameter fixes', () => {
    it('should produce correct fix for missing idempotency key', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              responses: { 201: { description: 'Created' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip158/list-paginated',
          'aip193/schema-defined',
          'aip193/responses-documented',
        ],
      }).review(spec);

      const idempotencyFinding = result.findings.find(
        (f) => f.ruleId === 'aip155/idempotency-key'
      );

      assert.ok(idempotencyFinding, 'Should have idempotency-key finding');
      assertValidFix(idempotencyFinding.fix, 'add-parameter');
      const idempotencyReplacement = /** @type {{name: string, in: string}} */ (
        idempotencyFinding.fix?.replacement
      );
      assert.equal(idempotencyReplacement.name, 'Idempotency-Key');
      assert.equal(idempotencyReplacement.in, 'header');
    });

    it('should produce correct fix for missing filter parameter', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              parameters: [
                {
                  name: 'page_size',
                  in: /** @type {const} */ ('query'),
                  schema: { type: 'integer' },
                },
              ],
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip193/schema-defined',
          'aip193/responses-documented',
          'aip158/max-page-size',
          'aip158/response-next-token',
        ],
      }).review(spec);

      const filterFinding = result.findings.find(
        (f) => f.ruleId === 'aip132/has-filtering'
      );

      assert.ok(filterFinding, 'Should have has-filtering finding');
      assertValidFix(filterFinding.fix, 'add-parameter');
      // @ts-expect-error - we know this is an add-parameter fix with replacement
      assert.equal(filterFinding.fix?.replacement?.name, 'filter');
      // @ts-expect-error - we know this is an add-parameter fix with replacement
      assert.equal(filterFinding.fix?.replacement?.in, 'query');
    });
  });

  describe('add-parameters fixes', () => {
    it('should produce correct fix for missing pagination', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip193/schema-defined',
          'aip193/responses-documented',
          'aip132/has-filtering',
          'aip132/has-ordering',
        ],
      }).review(spec);

      const paginationFinding = result.findings.find(
        (f) => f.ruleId === 'aip158/list-paginated'
      );

      assert.ok(paginationFinding, 'Should have list-paginated finding');
      assertValidFix(paginationFinding.fix, 'add-parameters');
      assert.ok(
        Array.isArray(paginationFinding.fix?.replacement),
        'Replacement should be array'
      );
      assert.equal(paginationFinding.fix?.replacement?.length, 2);
    });
  });

  describe('remove-request-body fixes', () => {
    it('should produce correct fix for GET with body', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            get: {
              requestBody: { content: { 'application/json': {} } },
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: ['aip193/schema-defined', 'aip193/responses-documented'],
      }).review(spec);

      const getBodyFinding = result.findings.find(
        (f) => f.ruleId === 'aip131/get-no-body'
      );

      assert.ok(getBodyFinding, 'Should have get-no-body finding');
      assertValidFix(getBodyFinding.fix, 'remove-request-body');
      assert.equal(getBodyFinding.fix?.specChanges[0].operation, 'remove');
    });
  });

  describe('change-status-code fixes', () => {
    it('should produce correct fix for POST returning 200', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip193/schema-defined',
          'aip193/responses-documented',
          'aip155/idempotency-key',
        ],
      }).review(spec);

      const statusCodeFinding = result.findings.find(
        (f) => f.ruleId === 'aip133/post-returns-201'
      );

      assert.ok(statusCodeFinding, 'Should have post-returns-201 finding');
      assertValidFix(statusCodeFinding.fix, 'change-status-code');
      assert.equal(statusCodeFinding.fix?.specChanges[0].from, '200');
      assert.equal(statusCodeFinding.fix?.specChanges[0].to, '201');
    });
  });

  describe('add-operation fixes', () => {
    it('should produce correct fix for PUT without PATCH', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            put: {
              requestBody: { content: { 'application/json': {} } },
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: ['aip193/schema-defined', 'aip193/responses-documented'],
      }).review(spec);

      const patchFinding = result.findings.find(
        (f) => f.ruleId === 'aip134/patch-over-put'
      );

      assert.ok(patchFinding, 'Should have patch-over-put finding');
      assertValidFix(patchFinding.fix, 'add-operation');
      assert.equal(patchFinding.fix?.target?.method, 'patch');
    });
  });

  describe('add-schema fixes', () => {
    it('should produce correct fix for missing error schema', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            get: { responses: { 200: { description: 'OK' } } },
          },
        },
        components: {
          schemas: {
            User: { type: 'object' },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: [
          'aip158/list-paginated',
          'aip193/responses-documented',
          'aip132/has-filtering',
          'aip132/has-ordering',
        ],
      }).review(spec);

      const schemaFinding = result.findings.find(
        (f) => f.ruleId === 'aip193/schema-defined'
      );

      assert.ok(schemaFinding, 'Should have schema-defined finding');
      assertValidFix(schemaFinding.fix, 'add-schema');
      assert.equal(schemaFinding.fix?.target?.schemaName, 'Error');
    });
  });

  describe('add-response fixes', () => {
    it('should produce correct fix for missing error responses', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            get: {
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const result = new OpenAPIReviewer({
        skipRules: ['aip193/schema-defined'],
      }).review(spec);

      const responseFinding = result.findings.find(
        (f) => f.ruleId === 'aip193/responses-documented'
      );

      assert.ok(responseFinding, 'Should have responses-documented finding');
      assertValidFix(responseFinding.fix, 'add-response');
      assert.equal(responseFinding.fix?.target?.statusCode, 'default');
    });
  });
});

describe('JSONPath validity', () => {
  it('should generate valid JSONPath for all fix types', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/user/{id}': {
          get: {
            requestBody: { content: {} },
            parameters: [
              {
                name: 'page_size',
                in: /** @type {const} */ ('query'),
                schema: { type: 'integer' },
              },
            ],
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: {} },
                  },
                },
              },
              418: { description: "I'm a teapot" },
            },
          },
          put: {
            responses: { 200: { description: 'OK' } },
          },
        },
        '/users': {
          post: {
            responses: { 200: { description: 'OK' } },
          },
        },
      },
    };

    const result = new OpenAPIReviewer().review(spec);

    for (const finding of result.findings) {
      assert.ok(finding.fix, `Finding ${finding.ruleId} should have fix`);
      assert.ok(
        finding.fix.jsonPath.startsWith('$'),
        `JSONPath should start with $ for ${finding.ruleId}`
      );

      for (const change of finding.fix.specChanges) {
        assert.ok(
          change.path.startsWith('$'),
          `Spec change path should start with $ for ${finding.ruleId}`
        );
        assert.ok(
          /^\$(\.paths|\.components|\[)/.test(change.path),
          `Spec change path should contain valid path component for ${finding.ruleId}`
        );
      }
    }
  });
});
