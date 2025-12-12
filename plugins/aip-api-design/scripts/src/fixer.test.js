// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OpenAPIFixer, applyAllFixes } from './fixer.js';

/**
 * @typedef {import('./types.ts').OpenAPISpec} OpenAPISpec
 * @typedef {import('./types.ts').Parameter} Parameter
 * @typedef {import('./types.ts').PathItem} PathItem
 */

/**
 * Helper to create a query parameter with proper typing
 * @param {string} name
 * @param {object} [schema]
 * @returns {Parameter}
 */
function queryParam(name, schema) {
  return { name, in: 'query', schema };
}

/**
 * Helper to safely get a path from spec
 * @param {OpenAPISpec} spec
 * @param {string} path
 * @returns {PathItem}
 */
function getPath(spec, path) {
  const pathItem = spec.paths?.[path];
  if (!pathItem) throw new Error(`Path ${path} not found`);
  return pathItem;
}

/**
 * Helper to safely get parameters from an operation
 * @param {OpenAPISpec} spec
 * @param {string} path
 * @param {'get'|'post'|'put'|'patch'|'delete'} method
 * @returns {Parameter[]}
 */
function getParams(spec, path, method) {
  const pathItem = getPath(spec, path);
  const op = pathItem[method];
  if (!op) throw new Error(`Method ${method} not found on ${path}`);
  return op.parameters ?? [];
}

describe('OpenAPIFixer', () => {
  describe('rename-key operation', () => {
    it('should rename a path in $.paths', () => {
      /** @type {OpenAPISpec} */
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: { responses: { 200: { description: 'OK' } } } },
          '/orders': { get: { responses: { 200: { description: 'OK' } } } },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'aip122/plural-resources',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'Resource name should be plural',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      const paths = fixer.getSpec().paths ?? {};
      assert.ok('/users' in paths);
      assert.ok(!('/user' in paths));
      assert.ok('/orders' in paths);
    });

    it('should fail if source key does not exist', () => {
      const spec = {
        openapi: '3.0.0',
        paths: { '/users': { get: {} } },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/nonexistent',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/nonexistent',
              to: '/something',
            },
          ],
        },
      });

      assert.strictEqual(result.applied, false);
      assert.ok(result.changes[0].error?.includes('not found'));
    });

    it('should fail if target key already exists', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: {} },
          '/users': { post: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
          ],
        },
      });

      assert.strictEqual(result.applied, false);
      assert.ok(result.changes[0].error?.includes('already exists'));
    });
  });

  describe('set operation', () => {
    it('should set a value at a nested path', () => {
      /** @type {OpenAPISpec} */
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              parameters: [queryParam('page_size', { type: 'integer' })],
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'aip158/max-page-size',
        severity: 'suggestion',
        category: 'pagination',
        path: 'GET /users',
        message: 'page_size has no maximum',
        fix: {
          type: 'set-schema-constraint',
          jsonPath: "$.paths['/users'].get.parameters[0].schema",
          specChanges: [
            {
              operation: 'set',
              path: "$.paths['/users'].get.parameters[0].schema.maximum",
              value: 100,
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      const param = fixer.getSpec().paths?.['/users']?.get?.parameters?.[0];
      assert.strictEqual(param?.schema?.maximum, 100);
    });

    it('should create intermediate objects if needed', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {},
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/test',
        message: 'test',
        fix: {
          type: 'add-schema',
          jsonPath: '$.components.schemas.Error',
          specChanges: [
            {
              operation: 'set',
              path: '$.components.schemas.Error',
              value: {
                type: 'object',
                properties: { code: { type: 'integer' } },
              },
            },
          ],
        },
      });

      assert.deepStrictEqual(fixer.getSpec().components?.schemas?.Error, {
        type: 'object',
        properties: { code: { type: 'integer' } },
      });
    });
  });

  describe('add operation', () => {
    it('should add a value to an existing array', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              parameters: [queryParam('existing')],
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'pagination',
        path: 'GET /users',
        message: 'test',
        fix: {
          type: 'add-parameter',
          jsonPath: "$.paths['/users'].get.parameters",
          specChanges: [
            {
              operation: 'add',
              path: "$.paths['/users'].get.parameters",
              value: queryParam('page_size', { type: 'integer' }),
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      const params = getParams(fixer.getSpec(), '/users', 'get');
      assert.strictEqual(params.length, 2);
      assert.strictEqual(params[1].name, 'page_size');
    });

    it('should create array if it does not exist', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {},
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'pagination',
        path: 'GET /users',
        message: 'test',
        fix: {
          type: 'add-parameter',
          jsonPath: "$.paths['/users'].get.parameters",
          specChanges: [
            {
              operation: 'add',
              path: "$.paths['/users'].get.parameters",
              value: queryParam('page_size'),
            },
          ],
        },
      });

      const params = getParams(fixer.getSpec(), '/users', 'get');
      assert.ok(Array.isArray(params));
      assert.strictEqual(params.length, 1);
    });
  });

  describe('remove operation', () => {
    it('should remove a request body', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users/{id}': {
            get: {
              requestBody: { content: { 'application/json': {} } },
              responses: { 200: { description: 'OK' } },
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'aip131/get-no-body',
        severity: 'error',
        category: 'standard-methods',
        path: 'GET /users/{id}',
        message: 'GET should not have request body',
        fix: {
          type: 'remove-request-body',
          jsonPath: "$.paths['/users/{id}'].get",
          specChanges: [
            {
              operation: 'remove',
              path: "$.paths['/users/{id}'].get.requestBody",
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      const pathItem = getPath(fixer.getSpec(), '/users/{id}');
      assert.strictEqual(pathItem.get?.requestBody, undefined);
      assert.ok(pathItem.get?.responses);
    });

    it('should succeed even if value does not exist', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': { get: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/users',
        message: 'test',
        fix: {
          type: 'remove-request-body',
          jsonPath: "$.paths['/users'].get",
          specChanges: [
            {
              operation: 'remove',
              path: "$.paths['/users'].get.requestBody",
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
    });
  });

  describe('merge operation', () => {
    it('should merge parameters into an existing array', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              parameters: [queryParam('existing')],
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'aip158/list-paginated',
        severity: 'warning',
        category: 'pagination',
        path: 'GET /users',
        message: 'Missing pagination',
        fix: {
          type: 'add-parameters',
          jsonPath: "$.paths['/users'].get.parameters",
          specChanges: [
            {
              operation: 'merge',
              path: "$.paths['/users'].get.parameters",
              value: [
                queryParam('page_size', { type: 'integer' }),
                queryParam('page_token', { type: 'string' }),
              ],
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      const params = getParams(fixer.getSpec(), '/users', 'get');
      assert.strictEqual(params.length, 3);
      assert.strictEqual(params[0].name, 'existing');
      assert.strictEqual(params[1].name, 'page_size');
      assert.strictEqual(params[2].name, 'page_token');
    });

    it('should merge objects into an existing object', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/',
        message: 'test',
        fix: {
          type: 'add-schema',
          jsonPath: '$.info',
          specChanges: [
            {
              operation: 'merge',
              path: '$.info',
              value: {
                description: 'A test API',
                contact: { email: 'test@example.com' },
              },
            },
          ],
        },
      });

      const info = fixer.getSpec().info;
      assert.strictEqual(info?.title, 'Test API');
      assert.strictEqual(info?.description, 'A test API');
      assert.strictEqual(info?.contact?.email, 'test@example.com');
    });

    it('should create array/object if target does not exist', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': { get: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'pagination',
        path: 'GET /users',
        message: 'test',
        fix: {
          type: 'add-parameters',
          jsonPath: "$.paths['/users'].get.parameters",
          specChanges: [
            {
              operation: 'merge',
              path: "$.paths['/users'].get.parameters",
              value: [queryParam('page_size')],
            },
          ],
        },
      });

      const params = getParams(fixer.getSpec(), '/users', 'get');
      assert.ok(Array.isArray(params));
      assert.strictEqual(params.length, 1);
    });
  });

  describe('JSONPath parsing', () => {
    it('should handle mixed bracket and dot notation', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users/{id}/orders': {
            get: {
              responses: {
                200: { description: 'OK' },
              },
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/users/{id}/orders',
        message: 'test',
        fix: {
          type: 'add-response',
          jsonPath: "$.paths['/users/{id}/orders'].get.responses",
          specChanges: [
            {
              operation: 'set',
              path: "$.paths['/users/{id}/orders'].get.responses['400']",
              value: { description: 'Bad Request' },
            },
          ],
        },
      });

      const pathItem = getPath(fixer.getSpec(), '/users/{id}/orders');
      assert.ok(pathItem.get?.responses?.['400']);
      assert.strictEqual(
        pathItem.get?.responses?.['400']?.description,
        'Bad Request'
      );
    });

    it('should handle numeric array indices', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              parameters: [queryParam('first'), queryParam('second')],
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/users',
        message: 'test',
        fix: {
          type: 'set-schema-constraint',
          jsonPath: "$.paths['/users'].get.parameters[1]",
          specChanges: [
            {
              operation: 'set',
              path: "$.paths['/users'].get.parameters[1].description",
              value: 'Updated description',
            },
          ],
        },
      });

      const params = getParams(fixer.getSpec(), '/users', 'get');
      assert.strictEqual(params[1].description, 'Updated description');
    });
  });

  describe('multiple changes in one fix', () => {
    it('should apply multiple changes sequentially', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': {
            get: {
              requestBody: { content: {} },
            },
          },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'multi-fix',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'Multiple issues',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
            {
              operation: 'remove',
              path: "$.paths['/users'].get.requestBody",
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      assert.strictEqual(result.changes.length, 2);
      const paths = fixer.getSpec().paths ?? {};
      assert.ok('/users' in paths);
      const pathItem = getPath(fixer.getSpec(), '/users');
      assert.strictEqual(pathItem.get?.requestBody, undefined);
    });

    it('should report partial failure when some changes fail', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec);
      const result = fixer.applyFix({
        ruleId: 'partial-fix',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/nonexistent',
              to: '/something',
            },
          ],
        },
      });

      assert.strictEqual(result.applied, false);
      assert.strictEqual(result.changes[0].applied, true);
      assert.strictEqual(result.changes[1].applied, false);
    });
  });

  describe('dry run mode', () => {
    it('should not modify spec in dry run mode', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec, { dryRun: true });
      const result = fixer.applyFix({
        ruleId: 'test-rule',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
          ],
        },
      });

      assert.strictEqual(result.applied, true);
      assert.ok('/user' in spec.paths); // Original unchanged
    });
  });

  describe('applyFixes helper', () => {
    it('should apply multiple findings', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: {} },
          '/order': { get: {} },
        },
      };

      const findings = [
        {
          ruleId: 'aip122/plural-resources',
          severity: /** @type {const} */ ('warning'),
          category: /** @type {const} */ ('naming'),
          path: '/user',
          message: 'Singular resource name',
          fix: {
            type: /** @type {const} */ ('rename-path-segment'),
            jsonPath: '$.paths',
            specChanges: [
              {
                operation: /** @type {const} */ ('rename-key'),
                path: '$.paths',
                from: '/user',
                to: '/users',
              },
            ],
          },
        },
        {
          ruleId: 'aip122/plural-resources',
          severity: /** @type {const} */ ('warning'),
          category: /** @type {const} */ ('naming'),
          path: '/order',
          message: 'Singular resource name',
          fix: {
            type: /** @type {const} */ ('rename-path-segment'),
            jsonPath: '$.paths',
            specChanges: [
              {
                operation: /** @type {const} */ ('rename-key'),
                path: '$.paths',
                from: '/order',
                to: '/orders',
              },
            ],
          },
        },
      ];

      const { spec: fixedSpec, summary } = applyAllFixes(spec, findings);

      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.applied, 2);
      const paths = fixedSpec.paths ?? {};
      assert.ok('/users' in paths);
      assert.ok('/orders' in paths);
    });

    it('should skip findings without fixes', () => {
      const spec = {
        openapi: '3.0.0',
        paths: { '/users': { get: {} } },
      };

      const findings = [
        {
          ruleId: 'test-rule',
          severity: /** @type {const} */ ('warning'),
          category: /** @type {const} */ ('naming'),
          path: '/users',
          message: 'No fix available',
          // No fix property
        },
      ];

      const { summary } = applyAllFixes(spec, findings);

      assert.strictEqual(summary.total, 0);
    });
  });

  describe('summary and error reporting', () => {
    it('should provide accurate summary', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/user': { get: {} },
          '/order': { get: {} },
        },
      };

      const fixer = new OpenAPIFixer(spec);

      fixer.applyFix({
        ruleId: 'fix-1',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
          ],
        },
      });

      fixer.applyFix({
        ruleId: 'fix-2',
        severity: 'warning',
        category: 'naming',
        path: '/nonexistent',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/nonexistent',
              to: '/something',
            },
          ],
        },
      });

      const summary = fixer.getSummary();
      assert.strictEqual(summary.total, 2);
      assert.strictEqual(summary.applied, 1);
      assert.strictEqual(summary.failed, 1);
      assert.strictEqual(summary.changes, 1);
    });

    it('should collect errors', () => {
      const spec = {
        openapi: '3.0.0',
        paths: {},
      };

      const fixer = new OpenAPIFixer(spec);

      fixer.applyFix({
        ruleId: 'failing-fix',
        severity: 'warning',
        category: 'naming',
        path: '/test',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/nonexistent',
              to: '/something',
            },
          ],
        },
      });

      assert.strictEqual(fixer.hasErrors(), true);
      const errors = fixer.getErrors();
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].ruleId, 'failing-fix');
      assert.ok(errors[0].error.includes('not found'));
    });
  });

  describe('edge cases', () => {
    it('should handle empty spec changes array', () => {
      const spec = { openapi: '3.0.0', paths: {} };
      const fixer = new OpenAPIFixer(spec);

      const result = fixer.applyFix({
        ruleId: 'empty-fix',
        severity: 'warning',
        category: 'naming',
        path: '/test',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [],
        },
      });

      assert.strictEqual(result.applied, true);
      assert.strictEqual(result.changes.length, 0);
    });

    it('should handle finding without fix', () => {
      const spec = { openapi: '3.0.0', paths: {} };
      const fixer = new OpenAPIFixer(spec);

      const result = fixer.applyFix({
        ruleId: 'no-fix',
        severity: 'warning',
        category: 'naming',
        path: '/test',
        message: 'test',
      });

      assert.strictEqual(result.applied, false);
      assert.strictEqual(result.changes.length, 0);
    });

    it('should clone spec to avoid mutation', () => {
      const original = {
        openapi: '3.0.0',
        paths: { '/user': { get: {} } },
      };

      const fixer = new OpenAPIFixer(original);
      fixer.applyFix({
        ruleId: 'test',
        severity: 'warning',
        category: 'naming',
        path: '/user',
        message: 'test',
        fix: {
          type: 'rename-path-segment',
          jsonPath: '$.paths',
          specChanges: [
            {
              operation: 'rename-key',
              path: '$.paths',
              from: '/user',
              to: '/users',
            },
          ],
        },
      });

      // Original should be unchanged
      assert.ok('/user' in (original.paths ?? {}));
      // Fixer's spec should be changed
      assert.ok('/users' in (fixer.getSpec().paths ?? {}));
    });
  });
});
