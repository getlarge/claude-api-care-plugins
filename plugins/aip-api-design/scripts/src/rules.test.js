/**
 * Tests for AIP-based OpenAPI Rules
 * Run with: node --test src/rules.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultRules, getRuleById } from './rules.js';

/**
 * Helper to run a single rule against a spec
 * @param {string} ruleId
 * @param {object} spec
 * @returns {import('./types.ts').Finding[]}
 */
function runRule(ruleId, spec) {
  const rule = getRuleById(ruleId);
  if (!rule) throw new Error(`Rule not found: ${ruleId}`);

  const ctx = {
    spec,
    createFinding: (partial) => ({
      ruleId: rule.id,
      severity: rule.severity,
      category: rule.category,
      aip: rule.aip,
      ...partial,
    }),
  };

  return rule.check(spec, ctx);
}

// ============================================
// Naming Rules
// ============================================

describe('naming/plural-resources', () => {
  it('flags singular resource names', () => {
    const spec = { paths: { '/user': {}, '/user/{id}': {} } };
    const findings = runRule('naming/plural-resources', spec);
    assert.equal(findings.length, 2);
    assert.ok(findings[0].message.includes("'user'"));
  });

  it('passes plural resource names', () => {
    const spec = { paths: { '/users': {}, '/users/{id}': {} } };
    const findings = runRule('naming/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('ignores exceptions like health, status, config', () => {
    const spec = { paths: { '/health': {}, '/status': {}, '/config': {} } };
    const findings = runRule('naming/plural-resources', spec);
    assert.equal(findings.length, 0);
  });
});

describe('naming/no-verbs', () => {
  it('flags verb prefixes in paths', () => {
    const spec = { paths: { '/getUsers': {}, '/createOrder': {} } };
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 2);
  });

  it('passes noun-only paths', () => {
    const spec = { paths: { '/users': {}, '/orders': {} } };
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows custom method suffixes with colon', () => {
    const spec = { paths: { '/orders/{id}:cancel': {} } };
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 0);
  });
});

describe('naming/consistent-casing', () => {
  it('flags mixed casing styles', () => {
    const spec = {
      paths: {
        '/user_accounts': {}, // snake_case
        '/orderItems': {}, // camelCase
      },
    };
    const findings = runRule('naming/consistent-casing', spec);
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
    const findings = runRule('naming/consistent-casing', spec);
    assert.equal(findings.length, 0);
  });

  it('passes all lowercase (no special casing)', () => {
    const spec = { paths: { '/users': {}, '/orders': {} } };
    const findings = runRule('naming/consistent-casing', spec);
    assert.equal(findings.length, 0);
  });
});

describe('naming/nested-ownership', () => {
  it('flags generic {id} in nested paths', () => {
    const spec = { paths: { '/users/{userId}/orders/{id}': {} } };
    const findings = runRule('naming/nested-ownership', spec);
    assert.equal(findings.length, 1);
    assert.ok(findings[0].message.includes("'{id}'"));
    assert.ok(findings[0].suggestion.includes('orderId'));
  });

  it('passes descriptive parameter names', () => {
    const spec = { paths: { '/users/{userId}/orders/{orderId}': {} } };
    const findings = runRule('naming/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });

  it('allows {id} at root level', () => {
    const spec = { paths: { '/users/{id}': {} } };
    const findings = runRule('naming/nested-ownership', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Standard Methods Rules
// ============================================

describe('methods/get-no-body', () => {
  it('flags GET with request body', () => {
    const spec = {
      paths: {
        '/users': {
          get: { requestBody: { content: {} } },
        },
      },
    };
    const findings = runRule('methods/get-no-body', spec);
    assert.equal(findings.length, 1);
  });

  it('passes GET without body', () => {
    const spec = {
      paths: { '/users': { get: { responses: { 200: {} } } } },
    };
    const findings = runRule('methods/get-no-body', spec);
    assert.equal(findings.length, 0);
  });
});

describe('methods/post-returns-201', () => {
  it('flags POST returning only 200', () => {
    const spec = {
      paths: {
        '/users': {
          post: { responses: { 200: {} } },
        },
      },
    };
    const findings = runRule('methods/post-returns-201', spec);
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
    const findings = runRule('methods/post-returns-201', spec);
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
    const findings = runRule('methods/post-returns-201', spec);
    assert.equal(findings.length, 0);
  });
});

describe('methods/patch-over-put', () => {
  it('flags PUT without PATCH on resource path', () => {
    const spec = {
      paths: {
        '/users/{id}': { put: {} },
      },
    };
    const findings = runRule('methods/patch-over-put', spec);
    assert.equal(findings.length, 1);
  });

  it('passes when both PUT and PATCH exist', () => {
    const spec = {
      paths: {
        '/users/{id}': { put: {}, patch: {} },
      },
    };
    const findings = runRule('methods/patch-over-put', spec);
    assert.equal(findings.length, 0);
  });
});

describe('methods/delete-idempotent', () => {
  it('flags DELETE with request body', () => {
    const spec = {
      paths: {
        '/users/{id}': {
          delete: { requestBody: { content: {} } },
        },
      },
    };
    const findings = runRule('methods/delete-idempotent', spec);
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
    const findings = runRule('methods/delete-idempotent', spec);
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
    const findings = runRule('methods/delete-idempotent', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Pagination Rules
// ============================================

describe('pagination/list-paginated', () => {
  it('flags collection GET without pagination', () => {
    const spec = {
      paths: {
        '/users': { get: { parameters: [] } },
      },
    };
    const findings = runRule('pagination/list-paginated', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with page_size param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'page_size', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('pagination/list-paginated', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with limit param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'limit', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('pagination/list-paginated', spec);
    assert.equal(findings.length, 0);
  });
});

describe('pagination/max-page-size', () => {
  it('flags page_size without maximum', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [
              { name: 'page_size', in: 'query', schema: { type: 'integer' } },
            ],
          },
        },
      },
    };
    const findings = runRule('pagination/max-page-size', spec);
    assert.equal(findings.length, 1);
  });

  it('passes page_size with maximum', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [
              {
                name: 'page_size',
                in: 'query',
                schema: { type: 'integer', maximum: 100 },
              },
            ],
          },
        },
      },
    };
    const findings = runRule('pagination/max-page-size', spec);
    assert.equal(findings.length, 0);
  });
});

describe('pagination/response-has-next-token', () => {
  it('flags paginated endpoint without next_page_token in response', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'page_size', in: 'query' }],
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
    const findings = runRule('pagination/response-has-next-token', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with next_page_token in response', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'page_size', in: 'query' }],
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
    const findings = runRule('pagination/response-has-next-token', spec);
    assert.equal(findings.length, 0);
  });

  it('resolves $ref to check response schema', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'page_size', in: 'query' }],
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
    const findings = runRule('pagination/response-has-next-token', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Error Rules
// ============================================

describe('errors/schema-defined', () => {
  it('flags missing error schema', () => {
    const spec = { components: { schemas: { User: {} } } };
    const findings = runRule('errors/schema-defined', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with Error schema', () => {
    const spec = { components: { schemas: { Error: {} } } };
    const findings = runRule('errors/schema-defined', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with ApiError schema', () => {
    const spec = { components: { schemas: { ApiError: {} } } };
    const findings = runRule('errors/schema-defined', spec);
    assert.equal(findings.length, 0);
  });
});

describe('errors/responses-documented', () => {
  it('flags operation with no error responses', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {} } },
        },
      },
    };
    const findings = runRule('errors/responses-documented', spec);
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
    const findings = runRule('errors/responses-documented', spec);
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
    const findings = runRule('errors/responses-documented', spec);
    assert.equal(findings.length, 0);
  });
});

describe('errors/standard-codes', () => {
  it('flags non-standard error codes', () => {
    const spec = {
      paths: {
        '/users': {
          get: { responses: { 200: {}, 418: {} } }, // I'm a teapot
        },
      },
    };
    const findings = runRule('errors/standard-codes', spec);
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
    const findings = runRule('errors/standard-codes', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Idempotency Rules
// ============================================

describe('idempotency/post-has-key', () => {
  it('flags POST without Idempotency-Key header', () => {
    const spec = {
      paths: {
        '/users': {
          post: { parameters: [] },
        },
      },
    };
    const findings = runRule('idempotency/post-has-key', spec);
    assert.equal(findings.length, 1);
  });

  it('passes POST with Idempotency-Key header', () => {
    const spec = {
      paths: {
        '/users': {
          post: {
            parameters: [{ name: 'Idempotency-Key', in: 'header' }],
          },
        },
      },
    };
    const findings = runRule('idempotency/post-has-key', spec);
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
    const findings = runRule('idempotency/post-has-key', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Filtering Rules
// ============================================

describe('filtering/list-filterable', () => {
  it('flags collection GET without filter params', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [
              { name: 'page_size', in: 'query' },
              { name: 'page_token', in: 'query' },
            ],
          },
        },
      },
    };
    const findings = runRule('filtering/list-filterable', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with filter param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'filter', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('filtering/list-filterable', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with field-specific filters', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'status', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('filtering/list-filterable', spec);
    assert.equal(findings.length, 0);
  });
});

describe('filtering/list-has-ordering', () => {
  it('flags collection GET without order_by', () => {
    const spec = {
      paths: {
        '/users': {
          get: { parameters: [] },
        },
      },
    };
    const findings = runRule('filtering/list-has-ordering', spec);
    assert.equal(findings.length, 1);
  });

  it('passes with order_by param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'order_by', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('filtering/list-has-ordering', spec);
    assert.equal(findings.length, 0);
  });

  it('passes with sort param', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            parameters: [{ name: 'sort', in: 'query' }],
          },
        },
      },
    };
    const findings = runRule('filtering/list-has-ordering', spec);
    assert.equal(findings.length, 0);
  });
});

// ============================================
// Version Prefix and Singleton Tests
// ============================================

describe('naming/plural-resources - version handling', () => {
  it('ignores v1, v2, etc version prefixes', () => {
    const spec = { paths: { '/v1/users': {}, '/v2/orders': {} } };
    const findings = runRule('naming/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('ignores api prefix', () => {
    const spec = { paths: { '/api/v1/users': {} } };
    const findings = runRule('naming/plural-resources', spec);
    assert.equal(findings.length, 0);
  });

  it('handles versioned path with singular resource', () => {
    const spec = { paths: { '/v1/user': {}, '/v1/user/{id}': {} } };
    const findings = runRule('naming/plural-resources', spec);
    // Should flag 'user' but not 'v1'
    assert.ok(findings.some((f) => f.message.includes("'user'")));
    assert.ok(!findings.some((f) => f.message.includes("'v1'")));
  });
});

describe('naming/plural-resources - singletons', () => {
  it('allows singular name for singleton resources', () => {
    const spec = {
      paths: {
        '/v1/database/backup': {},
        '/v1/database/restore': {},
        // Note: no /v1/database/{id} path
      },
    };
    const findings = runRule('naming/plural-resources', spec);
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
    const findings = runRule('naming/plural-resources', spec);
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
    const findings = runRule('naming/plural-resources', spec);
    // Should not flag 'email' since it's a singleton under settings
    const emailFindings = findings.filter((f) =>
      f.message.includes("'email'")
    );
    assert.equal(emailFindings.length, 0);
  });
});

describe('naming/no-verbs - custom methods', () => {
  it('allows hyphenated custom methods on resources', () => {
    const spec = {
      paths: {
        '/v1/passwords': {},
        '/v1/passwords/validate-hash': {},
        '/v1/passwords/validate-crypt': {},
      },
    };
    const findings = runRule('naming/no-verbs', spec);
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
    const findings = runRule('naming/no-verbs', spec);
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
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('still flags invalid verb usage on collection endpoints', () => {
    const spec = {
      paths: {
        '/v1/getUsers': {},
        '/v1/createOrder': {},
      },
    };
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 2);
  });
});

describe('naming/no-verbs - noun exceptions', () => {
  it('allows checklist as a noun', () => {
    const spec = { paths: { '/v1/checklists': {}, '/v1/checklists/{id}': {} } };
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 0);
  });

  it('allows singular checklist on resource paths', () => {
    const spec = { paths: { '/v1/checklist': {}, '/v1/checklist/{id}': {} } };
    const findings = runRule('naming/no-verbs', spec);
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
    const findings = runRule('naming/no-verbs', spec);
    assert.equal(findings.length, 0);
  });
});

describe('naming/no-verbs - version prefixes', () => {
  it('does not flag version prefixes', () => {
    const spec = {
      paths: {
        '/v1/users': {},
        '/v2/orders': {},
        '/api/v1/items': {},
      },
    };
    const findings = runRule('naming/no-verbs', spec);
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
      assert.ok(
        typeof rule.check === 'function',
        `${rule.id} missing check fn`
      );
    }
  });

  it('all rules have unique IDs', () => {
    const ids = defaultRules.map((r) => r.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });
});
