/**
 * Integration Tests - Acme Commerce API Fixture
 *
 * Tests the reviewer against a realistic, mixed-quality OpenAPI spec.
 * Validates both detection of violations AND absence of false positives.
 *
 * Run with: node --test tests/integration.test.js
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { OpenAPIReviewer } from '../src/reviewer.js';

// Optional: yaml parser for YAML fixtures
/** @type {typeof import('yaml') | undefined} */
let yaml;
try {
  yaml = await import('yaml');
} catch {
  // yaml is optional, will use JSON parsing
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures', 'acme-commerce.yaml');

/**
 * Load and parse the Acme Commerce fixture
 * @returns {Promise<import('../src/types.js').OpenAPISpec>}
 */
async function loadFixture() {
  const content = await readFile(FIXTURE_PATH, 'utf-8');
  if (yaml) {
    return yaml.parse(content);
  }
  throw new Error('yaml package required for YAML fixtures');
}

/**
 * Helper to find findings by rule ID
 * @param {import('../src/types.js').Finding[]} findings
 * @param {string} ruleId
 * @returns {import('../src/types.js').Finding[]}
 */
function findByRule(findings, ruleId) {
  return findings.filter((f) => f.ruleId === ruleId);
}

/**
 * Helper to find findings for a specific path
 * @param {import('../src/types.js').Finding[]} findings
 * @param {string} pathPattern - substring to match in finding.path
 * @returns {import('../src/types.js').Finding[]}
 */
function findByPath(findings, pathPattern) {
  return findings.filter((f) => f.path && f.path.includes(pathPattern));
}

describe('Acme Commerce API - Integration Tests', () => {
  /** @type {import('../src/types.js').OpenAPISpec} */
  let spec;
  /** @type {import('../src/types.js').ReviewResult} */
  let result;
  /** @type {import('../src/types.js').Finding[]} */
  let findings;

  before(async () => {
    spec = await loadFixture();
    const reviewer = new OpenAPIReviewer();
    result = reviewer.review(spec, FIXTURE_PATH);
    findings = result.findings;
  });

  // ============================================
  // NAMING RULES (AIP-122)
  // ============================================

  describe('aip122/plural-resources', () => {
    it('flags singular /product path', () => {
      const matches = findByRule(findings, 'aip122/plural-resources').filter(
        (f) => f.path?.includes('/product')
      );
      assert.ok(matches.length > 0, 'Should flag /product as singular');
    });

    it('flags singular /getOrder path (side effect)', () => {
      // getOrder is flagged because it looks like a singular resource
      const matches = findByRule(findings, 'aip122/plural-resources').filter(
        (f) => f.path?.includes('/getOrder')
      );
      assert.ok(matches.length > 0, 'Should flag /getOrder as singular');
    });

    it('does NOT flag /customers (plural)', () => {
      const matches = findByRule(findings, 'aip122/plural-resources').filter(
        (f) => f.path?.includes('/customers')
      );
      assert.equal(matches.length, 0, 'Should not flag /customers');
    });

    it('does NOT flag /health exception', () => {
      const matches = findByRule(findings, 'aip122/plural-resources').filter(
        (f) => f.path?.includes('/health')
      );
      assert.equal(matches.length, 0, 'Should not flag /health');
    });

    it('does NOT flag /status exception', () => {
      const matches = findByRule(findings, 'aip122/plural-resources').filter(
        (f) => f.path?.includes('/status')
      );
      assert.equal(matches.length, 0, 'Should not flag /status');
    });
  });

  describe('aip122/no-verbs', () => {
    it('flags /getOrder/{id} - verb prefix', () => {
      const matches = findByRule(findings, 'aip122/no-verbs').filter((f) =>
        f.path?.includes('/getOrder')
      );
      assert.ok(matches.length > 0, 'Should flag /getOrder/{id}');
    });

    it('does NOT flag /orders/{orderId}:cancel - custom method allowed', () => {
      const matches = findByRule(findings, 'aip122/no-verbs').filter((f) =>
        f.path?.includes(':cancel')
      );
      assert.equal(matches.length, 0, 'Should allow :cancel custom method');
    });
  });

  describe('aip122/consistent-casing', () => {
    it('flags inconsistent casing between /inventory_items and /stockLevels', () => {
      const matches = findByRule(findings, 'aip122/consistent-casing');
      assert.ok(
        matches.length > 0,
        'Should detect mixed snake_case and camelCase'
      );
    });
  });

  describe('aip122/nested-ownership', () => {
    it('flags /customers/{customerId}/addresses/{id} - generic {id}', () => {
      const matches = findByRule(findings, 'aip122/nested-ownership').filter(
        (f) => f.path?.includes('/addresses/')
      );
      assert.ok(matches.length > 0, 'Should flag generic {id} in nested path');
    });
  });

  // ============================================
  // STANDARD METHODS RULES
  // ============================================

  describe('aip131/get-no-body', () => {
    it('flags GET /reports with request body', () => {
      const matches = findByRule(findings, 'aip131/get-no-body').filter((f) =>
        f.path?.includes('/reports')
      );
      assert.ok(matches.length > 0, 'Should flag GET with body');
    });

    it('does NOT flag normal GET operations', () => {
      const matches = findByRule(findings, 'aip131/get-no-body').filter((f) =>
        f.path?.includes('/customers')
      );
      assert.equal(matches.length, 0, 'Should not flag normal GETs');
    });
  });

  describe('aip133/post-returns-201', () => {
    it('flags POST /orders returning 200', () => {
      const matches = findByRule(findings, 'aip133/post-returns-201').filter(
        (f) => f.path === 'POST /orders'
      );
      assert.ok(matches.length > 0, 'Should flag POST returning 200');
    });

    it('flags POST /products/search returning 200', () => {
      // Note: POST for search is itself questionable (should be GET with query params)
      // but the rule correctly flags the 200 response regardless
      const matches = findByRule(findings, 'aip133/post-returns-201').filter(
        (f) => f.path === 'POST /products/search'
      );
      assert.ok(matches.length > 0, 'Should flag POST search returning 200');
    });

    it('does NOT flag POST /customers returning 201', () => {
      const matches = findByRule(findings, 'aip133/post-returns-201').filter(
        (f) => f.path === 'POST /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag 201 response');
    });

    it('does NOT flag POST /reports returning 202 (async)', () => {
      const matches = findByRule(findings, 'aip133/post-returns-201').filter(
        (f) => f.path === 'POST /reports'
      );
      assert.equal(matches.length, 0, 'Should allow 202 for async operations');
    });
  });

  describe('aip134/patch-over-put', () => {
    it('flags PUT /orders/{orderId} without PATCH', () => {
      const matches = findByRule(findings, 'aip134/patch-over-put').filter(
        (f) => f.path?.includes('/orders/')
      );
      assert.ok(matches.length > 0, 'Should flag PUT without PATCH');
    });

    it('does NOT flag /customers/{customerId} which has PATCH', () => {
      const matches = findByRule(findings, 'aip134/patch-over-put').filter(
        (f) => f.path?.includes('/customers/')
      );
      assert.equal(matches.length, 0, 'Should not flag when PATCH exists');
    });
  });

  describe('aip135/delete-idempotent', () => {
    it('flags DELETE /product/{id} with request body', () => {
      const matches = findByRule(findings, 'aip135/delete-idempotent').filter(
        (f) => f.path?.includes('/product/')
      );
      assert.ok(matches.length > 0, 'Should flag DELETE with body');
    });

    it('does NOT flag DELETE /customers/{customerId}', () => {
      const matches = findByRule(findings, 'aip135/delete-idempotent').filter(
        (f) => f.path?.includes('/customers/')
      );
      assert.equal(matches.length, 0, 'Should not flag proper DELETE');
    });
  });

  // ============================================
  // PAGINATION RULES (AIP-158)
  // ============================================

  describe('aip158/list-paginated', () => {
    it('flags GET /orders - no pagination', () => {
      const matches = findByRule(findings, 'aip158/list-paginated').filter(
        (f) => f.path === 'GET /orders'
      );
      assert.ok(matches.length > 0, 'Should flag missing pagination');
    });

    it('does NOT flag GET /customers - has pagination', () => {
      const matches = findByRule(findings, 'aip158/list-paginated').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag paginated endpoint');
    });
  });

  describe('aip158/max-page-size', () => {
    it('flags GET /product - page_size without maximum', () => {
      const matches = findByRule(findings, 'aip158/max-page-size').filter(
        (f) => f.path?.includes('/product')
      );
      assert.ok(matches.length > 0, 'Should flag page_size without max');
    });

    it('does NOT flag GET /customers - has maximum', () => {
      const matches = findByRule(findings, 'aip158/max-page-size').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag when max is set');
    });
  });

  describe('aip158/response-next-token', () => {
    it('flags GET /inventory_items - InventoryItemList missing next_page_token', () => {
      const matches = findByRule(findings, 'aip158/response-next-token').filter(
        (f) => f.path?.includes('/inventory_items')
      );
      assert.ok(matches.length > 0, 'Should flag missing next_page_token');
    });

    it('does NOT flag GET /customers - CustomerList has next_page_token', () => {
      const matches = findByRule(findings, 'aip158/response-next-token').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag when token exists');
    });
  });

  // ============================================
  // ERROR RULES (AIP-193)
  // ============================================

  describe('aip193/schema-defined', () => {
    it('does NOT flag - Error schema is defined', () => {
      const matches = findByRule(findings, 'aip193/schema-defined');
      assert.equal(matches.length, 0, 'Should not flag when Error schema exists');
    });
  });

  describe('aip193/responses-documented', () => {
    it('flags GET /orders - no error responses', () => {
      const matches = findByRule(findings, 'aip193/responses-documented').filter(
        (f) => f.path === 'GET /orders'
      );
      assert.ok(matches.length > 0, 'Should flag missing error docs');
    });

    it('flags POST /webhook - no error responses', () => {
      const matches = findByRule(findings, 'aip193/responses-documented').filter(
        (f) => f.path === 'POST /webhook'
      );
      assert.ok(matches.length > 0, 'Should flag missing error docs');
    });

    it('does NOT flag GET /customers - has error responses', () => {
      const matches = findByRule(findings, 'aip193/responses-documented').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag documented errors');
    });
  });

  describe('aip193/standard-codes', () => {
    it('flags GET /teapot - 418 is non-standard', () => {
      const matches = findByRule(findings, 'aip193/standard-codes').filter(
        (f) => f.path?.includes('/teapot')
      );
      assert.ok(matches.length > 0, 'Should flag 418 status code');
    });
  });

  // ============================================
  // IDEMPOTENCY RULES (AIP-155)
  // ============================================

  describe('aip155/idempotency-key', () => {
    it('flags POST /orders - no Idempotency-Key', () => {
      const matches = findByRule(findings, 'aip155/idempotency-key').filter(
        (f) => f.path === 'POST /orders'
      );
      assert.ok(matches.length > 0, 'Should flag missing idempotency key');
    });

    it('flags POST /webhook - no Idempotency-Key', () => {
      const matches = findByRule(findings, 'aip155/idempotency-key').filter(
        (f) => f.path === 'POST /webhook'
      );
      assert.ok(matches.length > 0, 'Should flag missing idempotency key');
    });

    it('does NOT flag POST /customers - has Idempotency-Key', () => {
      const matches = findByRule(findings, 'aip155/idempotency-key').filter(
        (f) => f.path === 'POST /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag when key exists');
    });

    it('does NOT flag POST /products/search - search exception', () => {
      const matches = findByRule(findings, 'aip155/idempotency-key').filter(
        (f) => f.path?.includes('/search')
      );
      assert.equal(matches.length, 0, 'Should skip search endpoints');
    });
  });

  // ============================================
  // FILTERING RULES (AIP-132)
  // ============================================

  describe('aip132/has-filtering', () => {
    it('flags GET /orders - no filter param', () => {
      const matches = findByRule(findings, 'aip132/has-filtering').filter(
        (f) => f.path === 'GET /orders'
      );
      assert.ok(matches.length > 0, 'Should flag missing filter param');
    });

    it('does NOT flag GET /customers - has filter param', () => {
      const matches = findByRule(findings, 'aip132/has-filtering').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag when filter exists');
    });
  });

  describe('aip132/has-ordering', () => {
    it('flags GET /orders - no order_by param', () => {
      const matches = findByRule(findings, 'aip132/has-ordering').filter(
        (f) => f.path === 'GET /orders'
      );
      assert.ok(matches.length > 0, 'Should flag missing order_by');
    });

    it('does NOT flag GET /customers - has order_by', () => {
      const matches = findByRule(findings, 'aip132/has-ordering').filter(
        (f) => f.path === 'GET /customers'
      );
      assert.equal(matches.length, 0, 'Should not flag when order_by exists');
    });

    it('does NOT flag GET /inventory_items - has sort param', () => {
      const matches = findByRule(findings, 'aip132/has-ordering').filter(
        (f) => f.path === 'GET /inventory_items'
      );
      assert.equal(matches.length, 0, 'Should accept sort as alternative');
    });
  });

  // ============================================
  // SUMMARY VALIDATION
  // ============================================

  describe('Review Summary', () => {
    it('produces findings across multiple categories', () => {
      const categories = new Set(findings.map((f) => f.category));
      assert.ok(categories.has('naming'), 'Should have naming findings');
      assert.ok(
        categories.has('standard-methods'),
        'Should have methods findings'
      );
      assert.ok(categories.has('pagination'), 'Should have pagination findings');
      assert.ok(categories.has('errors'), 'Should have error findings');
      assert.ok(
        categories.has('idempotency'),
        'Should have idempotency findings'
      );
    });

    it('has reasonable finding count', () => {
      // The fixture has intentional issues plus some additional findings
      // from list endpoints that lack filtering/ordering
      assert.ok(
        findings.length >= 10,
        `Expected at least 10 findings, got ${findings.length}`
      );
      assert.ok(
        findings.length <= 70,
        `Expected at most 70 findings, got ${findings.length}`
      );
    });

    it('includes metadata', () => {
      assert.ok(result.metadata.reviewedAt, 'Should have review timestamp');
      assert.ok(result.metadata.reviewerVersion, 'Should have version');
      assert.ok(result.metadata.rulesApplied.length > 0, 'Should list rules');
    });

    it('spec info is captured', () => {
      assert.equal(result.specTitle, 'Acme Commerce API');
      assert.equal(result.specVersion, '1.0.0');
    });
  });
});

describe('Acme Commerce API - Finding Quality', () => {
  /** @type {import('../src/types.js').Finding[]} */
  let findings;

  before(async () => {
    const spec = await loadFixture();
    const reviewer = new OpenAPIReviewer();
    findings = reviewer.review(spec, FIXTURE_PATH).findings;
  });

  it('all findings have required fields', () => {
    for (const finding of findings) {
      assert.ok(finding.ruleId, 'Finding must have ruleId');
      assert.ok(finding.severity, 'Finding must have severity');
      assert.ok(finding.category, 'Finding must have category');
      assert.ok(finding.message, 'Finding must have message');
    }
  });

  it('findings have actionable suggestions', () => {
    const withSuggestions = findings.filter((f) => f.suggestion);
    const ratio = withSuggestions.length / findings.length;
    assert.ok(
      ratio >= 0.5,
      `Expected at least 50% of findings to have suggestions, got ${Math.round(ratio * 100)}%`
    );
  });

  it('findings reference AIPs where applicable', () => {
    const withAip = findings.filter((f) => f.aip);
    assert.ok(
      withAip.length > 0,
      'At least some findings should reference AIPs'
    );
  });
});

describe('Acme Commerce API - Known Issues Breakdown', () => {
  /** @type {import('../src/types.js').Finding[]} */
  let findings;

  before(async () => {
    const spec = await loadFixture();
    const reviewer = new OpenAPIReviewer();
    findings = reviewer.review(spec, FIXTURE_PATH).findings;
  });

  it('summarizes findings by rule', () => {
    /** @type {Record<string, number>} */
    const byRule = {};
    for (const f of findings) {
      byRule[f.ruleId] = (byRule[f.ruleId] || 0) + 1;
    }

    // Log summary for debugging
    console.log('\n  Findings by rule:');
    for (const [ruleId, count] of Object.entries(byRule).sort()) {
      console.log(`    ${ruleId}: ${count}`);
    }

    // Basic sanity checks on intentional issues
    assert.ok(byRule['aip122/no-verbs'] >= 1, 'Should find verb violations');
    assert.ok(byRule['aip122/plural-resources'] >= 1, 'Should find singular resources');
    assert.ok(byRule['aip134/patch-over-put'] >= 1, 'Should find PUT without PATCH');
    assert.ok(byRule['aip158/list-paginated'] >= 1, 'Should find unpaginated lists');
    assert.ok(byRule['aip155/idempotency-key'] >= 1, 'Should find missing idempotency');
  });
});
