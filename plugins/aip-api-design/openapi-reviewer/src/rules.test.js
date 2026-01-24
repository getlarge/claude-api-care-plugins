/**
 * Tests for AIP-based OpenAPI Rules
 * Run with: node --test src/rules.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultRules,
  getRuleById,
  SpecRule,
  PathRule,
  OperationRule,
  ParameterRule,
  getAllOperations,
} from './rules/index.js';

/**
 * @typedef {import('./types.ts').Parameter} Parameter
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
 * Helper to create a header parameter with proper typing
 * @param {string} name
 * @param {object} [schema]
 * @returns {Parameter}
 */
function headerParam(name, schema) {
  return { name, in: 'header', schema };
}

/**
 * Helper to run a single rule against a spec
 * Uses the same dispatch logic as OpenAPIReviewer
 * @param {string} ruleId
 * @param {import('./types.ts').OpenAPISpec} spec
 * @returns {import('./types.ts').Finding[]}
 */
function runRule(ruleId, spec) {
  const rule = getRuleById(ruleId);
  if (!rule) throw new Error(`Rule not found: ${ruleId}`);

  /** @type {import('./types.js').RuleContext} */
  const ctx = {
    spec,
    createFinding: (
      /** @type {Partial<import('./types.js').Finding>} */ partial
      // @ts-ignore
    ) => ({
      ruleId: rule.id,
      severity: rule.severity,
      category: rule.category,
      aip: rule.aip,
      ...partial,
    }),
  };

  /** @type {import('./types.ts').Finding[]} */
  const findings = [];

  // Dispatch based on rule type (same logic as reviewer.js)
  if (rule instanceof SpecRule) {
    findings.push(...rule.checkSpec(spec, ctx));
  } else if (rule instanceof PathRule) {
    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      findings.push(...rule.checkPath(path, pathItem, spec, ctx));
    }
  } else if (rule instanceof OperationRule) {
    const operations = getAllOperations(spec);
    for (const { path, method, operation } of operations) {
      // Check method filter if specified
      if (rule.methods && !rule.methods.includes(method)) continue;
      findings.push(...rule.checkOperation(method, operation, path, spec, ctx));
    }
  } else if (rule instanceof ParameterRule) {
    // ParameterRule checks individual parameters
    const operations = getAllOperations(spec);
    for (const { path, method, operation } of operations) {
      // Check location filter if specified
      const params = operation.parameters || [];
      for (const param of params) {
        if (rule.locations && !rule.locations.includes(param.in)) continue;
        findings.push(...rule.checkParameter(param, method, path, spec, ctx));
      }
    }
  }

  return findings;
}

// ============================================
// Naming Rules
// ============================================

describe('aip122/plural-resources', () => {
  it('flags singular resource names', () => {
    const spec = { paths: { '/user': {}, '/user/{id}': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    assert.equal(findings.length, 2);
    assert.ok(findings[0].message.includes("'user'"));
  });

  it('passes plural resource names', () => {
    const spec = { paths: { '/users': {}, '/users/{id}': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('ignores exceptions like health, status, config', () => {
    const spec = { paths: { '/health': {}, '/status': {}, '/config': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip122/no-verbs', () => {
  it('flags verb prefixes in paths', () => {
    const spec = { paths: { '/getUsers': {}, '/createOrder': {} } };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 2);
  });

  it('passes noun-only paths', () => {
    const spec = { paths: { '/users': {}, '/orders': {} } };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows custom method suffixes with colon', () => {
    const spec = { paths: { '/orders/{id}:cancel': {} } };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip122/consistent-casing', () => {
  it('flags mixed casing styles', () => {
    const spec = {
      paths: {
        '/user_accounts': {}, // snake_case
        '/orderItems': {}, // camelCase
      },
    };
    const findings = runRule('aip122/consistent-casing', spec);
    assert.ok(findings.length > 0);
    assert.ok(findings[0].message.includes('Inconsistent casing'));
  });

  it('passes consistent snake_case', () => {
    const spec = {
      paths: {
        '/user_accounts': {},
        '/order_items': {},
      },
    };
    const findings = runRule('aip122/consistent-casing', spec);
    assert.equal(findings.length, 0);
  });

  it('passes all lowercase (no special casing)', () => {
    const spec = { paths: { '/users': {}, '/orders': {} } };
    const findings = runRule('aip122/consistent-casing', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip122/nested-ownership', () => {
  it('flags generic {id} in truly nested paths', () => {
    const spec = { paths: { '/users/{userId}/orders/{id}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].message.includes("'{id}'"));
    assert.ok(findings[0].suggestion?.includes('orderId'));
  });

  it('passes descriptive parameter names', () => {
    const spec = { paths: { '/users/{userId}/orders/{orderId}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });

  it('allows {id} at root level', () => {
    const spec = { paths: { '/users/{id}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });

  it('allows {id} with version prefix (not truly nested)', () => {
    // /v1/maintenance/{id} has only 1 resource-param pair, so not nested
    const spec = { paths: { '/v1/maintenance/{id}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });

  it('allows {id} on simple versioned paths', () => {
    // /v1/users/{id} has only 1 resource-param pair
    const spec = { paths: { '/v1/users/{id}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });

  it('flags {id} in deeply nested paths', () => {
    // /v1/users/{userId}/posts/{postId}/comments/{id} has 3 resource-param pairs
    const spec = {
      paths: { '/v1/users/{userId}/posts/{postId}/comments/{id}': {} },
    };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].suggestion?.includes('commentId'));
  });

  it('handles api prefix correctly', () => {
    // /api/v1/items/{id} has only 1 resource-param pair
    const spec = { paths: { '/api/v1/items/{id}': {} } };
    const findings = runRule('aip122/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Standard Methods Rules
// ============================================

describe('aip131/get-no-body', () => {
  it('flags GET with request body', () => {
    const spec = {
      paths: {
        '/users': {
          get: { requestBody: { content: {} } },
        },
      },
    };
    const findings = runRule('aip131/get-no-body', spec);
    assert.equal(findings.length, 1);
  });

  it('passes GET without body', () => {
    const spec = {
      paths: { '/users': { get: { responses: { 200: {} } } } },
    };
    const findings = runRule('aip131/get-no-body', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip133/post-returns-201', () => {
  it('flags POST returning only 200', () => {
    const spec = {
      paths: {
        '/users': {
          post: { responses: { 200: {} } },
        },
      },
    };
    const findings = runRule('aip133/post-returns-201', spec);
    assert.equal(findings.length, 1);
  });

  it('passes POST with 201', () => {
    const spec = {
      paths: {
        '/users': {
          post: { responses: { 201: {} } },
        },
      },
    };
    const findings = runRule('aip133/post-returns-201', spec);
    assert.equal(findings.length, 0);
  });

  it('passes POST with 202 (async)', () => {
    const spec = {
      paths: {
        '/jobs': {
          post: { responses: { 202: {} } },
        },
      },
    };
    const findings = runRule('aip133/post-returns-201', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip134/patch-over-put', () => {
  it('flags PUT without PATCH on resource path', () => {
    const spec = {
      paths: {
        '/users/{id}': { put: {} },
      },
    };
    const findings = runRule('aip134/patch-over-put', spec);
    assert.equal(findings.length, 1);
  });

  it('passes when both PUT and PATCH exist', () => {
    const spec = {
      paths: {
        '/users/{id}': { put: {}, patch: {} },
      },
    };
    const findings = runRule('aip134/patch-over-put', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip135/delete-idempotent', () => {
  it('flags DELETE with request body', () => {
    const spec = {
      paths: {
        '/users/{id}': {
          delete: { requestBody: { content: {} } },
        },
      },
    };
    const findings = runRule('aip135/delete-idempotent', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].message.includes('request body'));
  });

  it('flags DELETE returning 201', () => {
    const spec = {
      paths: {
        '/users/{id}': {
          delete: { responses: { 201: {} } },
        },
      },
    };
    const findings = runRule('aip135/delete-idempotent', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].message.includes('201'));
  });

  it('passes DELETE with 204', () => {
    const spec = {
      paths: {
        '/users/{id}': {
          delete: { responses: { 204: {} } },
        },
      },
    };
    const findings = runRule('aip135/delete-idempotent', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Pagination Rules
// ============================================

describe('aip158/list-paginated', () => {
  it('flags collection GET without pagination', () => {
    const spec = {
      paths: {
        '/users': { get: { parameters: [] } },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with page_size param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size')],
          },
        },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with limit param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('limit')],
          },
        },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 0);
  });

  it('skips singleton endpoints like /health, /status', () => {
    const spec = {
      paths: {
        '/health': { get: { parameters: [] } },
        '/status': { get: { parameters: [] } },
        '/metrics': { get: { parameters: [] } },
        '/info': { get: { parameters: [] } },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 0);
  });

  it('skips singular noun endpoints (not collections)', () => {
    const spec = {
      paths: {
        '/user': { get: { parameters: [] } }, // singular, not a collection
        '/config': { get: { parameters: [] } }, // uncountable
        '/data': { get: { parameters: [] } }, // uncountable
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 0);
  });

  it('flags plural noun endpoints (collections)', () => {
    const spec = {
      paths: {
        '/orders': { get: { parameters: [] } },
        '/products': { get: { parameters: [] } },
        '/categories': { get: { parameters: [] } },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 3);
  });

  it('skips auth-related endpoints', () => {
    const spec = {
      paths: {
        '/auth': { get: { parameters: [] } },
        '/login': { get: { parameters: [] } },
        '/logout': { get: { parameters: [] } },
        '/token': { get: { parameters: [] } },
      },
    };
    const findings = runRule('aip158/list-paginated', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip158/max-page-size', () => {
  it('flags page_size without maximum', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size', { type: 'integer' })],
          },
        },
      },
    };
    const findings = runRule('aip158/max-page-size', spec);
    assert.equal(findings.length, 1);
  });

  it('passes page_size with maximum', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [
              queryParam('page_size', { type: 'integer', maximum: 100 }),
            ],
          },
        },
      },
    };
    const findings = runRule('aip158/max-page-size', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip158/response-next-token', () => {
  it('flags paginated endpoint without next_page_token in response', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size')],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      properties: {
                        items: { type: 'array' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const findings = runRule('aip158/response-next-token', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with next_page_token in response', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size')],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      properties: {
                        items: { type: 'array' },
                        next_page_token: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
    const findings = runRule('aip158/response-next-token', spec);
    assert.equal(findings.length, 0);
  });

  it('resolves $ref to check response schema', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size')],
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserList' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          UserList: {
            properties: {
              items: { type: 'array' },
              next_page_token: { type: 'string' },
            },
          },
        },
      },
    };
    const findings = runRule('aip158/response-next-token', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Error Rules
// ============================================

describe('aip193/schema-defined', () => {
  it('flags missing error schema', () => {
    const spec = { components: { schemas: { User: {} } } };
    const findings = runRule('aip193/schema-defined', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with Error schema', () => {
    const spec = { components: { schemas: { Error: {} } } };
    const findings = runRule('aip193/schema-defined', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with ApiError schema', () => {
    const spec = { components: { schemas: { ApiError: {} } } };
    const findings = runRule('aip193/schema-defined', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip193/responses-documented', () => {
  it('flags operation with no error responses', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {} } },
        },
      },
    };
    const findings = runRule('aip193/responses-documented', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with 4xx response', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {}, 404: {} } },
        },
      },
    };
    const findings = runRule('aip193/responses-documented', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with default response', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {}, default: {} } },
        },
      },
    };
    const findings = runRule('aip193/responses-documented', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip193/standard-codes', () => {
  it('flags non-standard error codes', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {}, 418: {} } }, // I'm a teapot
        },
      },
    };
    const findings = runRule('aip193/standard-codes', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].message.includes('418'));
  });

  it('passes standard error codes', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {}, 400: {}, 404: {}, 500: {} } },
        },
      },
    };
    const findings = runRule('aip193/standard-codes', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Idempotency Rules
// ============================================

describe('aip155/idempotency-key', () => {
  it('flags POST without Idempotency-Key header', () => {
    const spec = {
      paths: {
        '/users': {
          post: { parameters: [] },
        },
      },
    };
    const findings = runRule('aip155/idempotency-key', spec);
    assert.equal(findings.length, 1);
  });

  it('passes POST with Idempotency-Key header', () => {
    const spec = {
      paths: {
        '/users': {
          post: {
            parameters: [headerParam('Idempotency-Key')],
          },
        },
      },
    };
    const findings = runRule('aip155/idempotency-key', spec);
    assert.equal(findings.length, 0);
  });

  it('skips search endpoints', () => {
    const spec = {
      paths: {
        '/users/search': {
          post: { parameters: [] },
        },
      },
    };
    const findings = runRule('aip155/idempotency-key', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Filtering Rules
// ============================================

describe('aip132/has-filtering', () => {
  it('flags collection GET without filter params', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('page_size'), queryParam('page_token')],
          },
        },
      },
    };
    const findings = runRule('aip132/has-filtering', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with filter param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('filter')],
          },
        },
      },
    };
    const findings = runRule('aip132/has-filtering', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with field-specific filters', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('status')],
          },
        },
      },
    };
    const findings = runRule('aip132/has-filtering', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip132/has-ordering', () => {
  it('flags collection GET without order_by', () => {
    const spec = {
      paths: {
        '/users': {
          get: { parameters: [] },
        },
      },
    };
    const findings = runRule('aip132/has-ordering', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with order_by param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('order_by')],
          },
        },
      },
    };
    const findings = runRule('aip132/has-ordering', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with sort param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [queryParam('sort')],
          },
        },
      },
    };
    const findings = runRule('aip132/has-ordering', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Version Prefix and Singleton Tests
// ============================================

describe('aip122/plural-resources - version handling', () => {
  it('ignores v1, v2, etc version prefixes', () => {
    const spec = { paths: { '/v1/users': {}, '/v2/orders': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('ignores api prefix', () => {
    const spec = { paths: { '/api/v1/users': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('handles versioned path with singular resource', () => {
    const spec = { paths: { '/v1/user': {}, '/v1/user/{id}': {} } };
    const findings = runRule('aip122/plural-resources', spec);
    // Should flag 'user' but not 'v1'
    assert.ok(findings.some((f) => f.message.includes("'user'")));
    assert.ok(!findings.some((f) => f.message.includes("'v1'")));
  });
});

describe('aip122/plural-resources - singletons', () => {
  it('allows singular name for singleton resources', () => {
    const spec = {
      paths: {
        '/v1/database/backup': {},
        '/v1/database/restore': {},
        // Note: no /v1/database/{id} path
      },
    };
    const findings = runRule('aip122/plural-resources', spec);
    // Should not flag 'database' since it's a singleton
    const dbFindings = findings.filter((f) => f.message.includes("'database'"));
    assert.equal(dbFindings.length, 0);
  });

  it('still flags singular collection resources', () => {
    const spec = {
      paths: {
        '/v1/user': {}, // singular collection - should flag
        '/v1/user/{id}': {}, // has id variant, so not singleton
      },
    };
    const findings = runRule('aip122/plural-resources', spec);
    assert.ok(findings.some((f) => f.message.includes("'user'")));
  });

  it('allows singular name for nested singleton', () => {
    const spec = {
      paths: {
        '/v1/settings/email': {},
        '/v1/settings/email/smtp-restore': {},
        // No /v1/settings/email/{id} path
      },
    };
    const findings = runRule('aip122/plural-resources', spec);
    // Should not flag 'email' since it's a singleton under settings
    const emailFindings = findings.filter((f) => f.message.includes("'email'"));
    assert.equal(emailFindings.length, 0);
  });
});

describe('aip122/no-verbs - custom methods', () => {
  it('allows hyphenated custom methods on resources', () => {
    const spec = {
      paths: {
        '/v1/passwords': {},
        '/v1/passwords/validate-hash': {},
        '/v1/passwords/validate-crypt': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows action verbs on singleton resources', () => {
    const spec = {
      paths: {
        '/v1/database/clear': {},
        '/v1/database/backup': {},
        '/v1/database/restore': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows action verbs on resource items', () => {
    const spec = {
      paths: {
        '/v1/models': {},
        '/v1/models/{id}': {},
        '/v1/models/{id}/train': {},
        '/v1/models/{id}/predict': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('still flags invalid verb usage on collection endpoints', () => {
    const spec = {
      paths: {
        '/v1/getUsers': {},
        '/v1/createOrder': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 2);
  });
});

describe('aip122/no-verbs - noun exceptions', () => {
  it('allows checklist as a noun', () => {
    const spec = { paths: { '/v1/checklists': {}, '/v1/checklists/{id}': {} } };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows singular checklist on resource paths', () => {
    const spec = { paths: { '/v1/checklist': {}, '/v1/checklist/{id}': {} } };
    const findings = runRule('aip122/no-verbs', spec);
    // Should flag singular form by plural rule, but NOT as a verb
    const verbFindings = findings.filter((f) => f.message.includes('verb'));
    assert.equal(verbFindings.length, 0);
  });

  it('allows download/upload as nouns in collection paths', () => {
    const spec = {
      paths: {
        '/v1/downloads': {},
        '/v1/downloads/{id}': {},
        '/v1/uploads': {},
        '/v1/uploads/{id}': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });
});

describe('aip122/no-verbs - version prefixes', () => {
  it('does not flag version prefixes', () => {
    const spec = {
      paths: {
        '/v1/users': {},
        '/v2/orders': {},
        '/api/v1/items': {},
      },
    };
    const findings = runRule('aip122/no-verbs', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Meta Tests
// ============================================

describe('defaultRules', () => {
  it('exports 17 rules', () => {
    assert.equal(defaultRules.length, 17);
  });

  it('all rules have required fields', () => {
    for (const rule of defaultRules) {
      assert.ok(rule.id, `Rule missing id`);
      assert.ok(rule.name, `${rule.id} missing name`);
      assert.ok(rule.category, `${rule.id} missing category`);
      assert.ok(rule.severity, `${rule.id} missing severity`);
      assert.ok(rule.description, `${rule.id} missing description`);
      // Rules use typed methods (checkSpec, checkPath, checkOperation, checkParameter, etc.)
      const hasCheckMethod =
        (rule instanceof SpecRule && typeof rule.checkSpec === 'function') ||
        (rule instanceof PathRule && typeof rule.checkPath === 'function') ||
        (rule instanceof OperationRule &&
          typeof rule.checkOperation === 'function') ||
        (rule instanceof ParameterRule &&
          typeof rule.checkParameter === 'function');
      assert.ok(hasCheckMethod, `${rule.id} missing typed check method`);
    }
  });

  it('all rules have unique IDs', () => {
    const ids = defaultRules.map((r) => r.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });
});
