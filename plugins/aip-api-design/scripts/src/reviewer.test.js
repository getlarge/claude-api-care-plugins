/**
 * Integration Tests for OpenAPI Reviewer
 * Tests the new typed rule system and RuleRegistry
 * Run with: node --test src/reviewer.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OpenAPIReviewer,
  reviewSpec,
  reviewSpecStrict,
} from './reviewer.js';
import {
  defaultRules,
  defaultRegistry,
  RuleRegistry,
  BaseRule,
  SpecRule,
  PathRule,
  OperationRule,
  SchemaRule,
  ParameterRule,
} from './rules/index.js';

// ============================================
// Registry Tests
// ============================================

describe('RuleRegistry', () => {
  it('contains 17 rules', () => {
    assert.equal(defaultRules.length, 17);
  });

  it('all rules are BaseRule instances', () => {
    for (const rule of defaultRules) {
      assert.ok(rule instanceof BaseRule, `${rule.id} is not a BaseRule`);
    }
  });

  it('all rules have required fields', () => {
    for (const rule of defaultRules) {
      assert.ok(rule.id, `Rule missing id`);
      assert.ok(rule.name, `${rule.id} missing name`);
      assert.ok(rule.category, `${rule.id} missing category`);
      assert.ok(rule.severity, `${rule.id} missing severity`);
      assert.ok(rule.description, `${rule.id} missing description`);
    }
  });

  it('all rules have unique IDs', () => {
    const ids = defaultRules.map((r) => r.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size);
  });

  it('rules are grouped by AIP number', () => {
    const aips = defaultRegistry.getAips();
    assert.deepEqual(aips, [122, 131, 132, 133, 134, 135, 155, 158, 193]);
  });

  it('can query rules by AIP', () => {
    const aip122 = defaultRegistry.getByAip(122);
    assert.equal(aip122.length, 4); // plural-resources, no-verbs, consistent-casing, nested-ownership
    assert.ok(aip122.every((r) => r.aip === 'AIP-122' || r.aip === 'AIP-131'));
  });

  it('can query rules by category', () => {
    const namingRules = defaultRegistry.getByCategory('naming');
    assert.equal(namingRules.length, 4);
  });

  it('can query rules by type', () => {
    const pathRules = defaultRegistry.getByType(PathRule);
    const operationRules = defaultRegistry.getByType(OperationRule);
    const specRules = defaultRegistry.getByType(SpecRule);
    const parameterRules = defaultRegistry.getByType(ParameterRule);

    assert.ok(pathRules.length > 0, 'Should have PathRules');
    assert.ok(operationRules.length > 0, 'Should have OperationRules');
    assert.ok(specRules.length > 0, 'Should have SpecRules');
    assert.ok(parameterRules.length > 0, 'Should have ParameterRules');

    // Total should equal defaultRules.length
    const total =
      pathRules.length +
      operationRules.length +
      specRules.length +
      parameterRules.length;
    assert.equal(total, defaultRules.length);
  });
});

// ============================================
// Reviewer Integration Tests
// ============================================

describe('OpenAPIReviewer', () => {
  it('reviews a simple spec', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0' },
      paths: {
        '/users': { get: {} },
      },
    };

    const result = reviewSpec(spec);

    assert.ok(result.findings.length > 0, 'Should have findings');
    assert.ok(result.summary.warnings >= 0);
    assert.ok(result.summary.suggestions >= 0);
    assert.equal(result.metadata.reviewerVersion, '2.0.0');
  });

  it('flags singular resource names', () => {
    const spec = {
      paths: { '/user': {}, '/user/{id}': {} },
    };

    const result = reviewSpec(spec);
    const pluralFindings = result.findings.filter(
      (f) => f.ruleId === 'aip122/plural-resources'
    );

    assert.ok(pluralFindings.length > 0);
    assert.ok(pluralFindings[0].message.includes("'user'"));
  });

  it('flags GET with request body', () => {
    const spec = {
      paths: {
        '/users': {
          get: { requestBody: { content: {} } },
        },
      },
    };

    const result = reviewSpec(spec);
    const getBodyFindings = result.findings.filter(
      (f) => f.ruleId === 'aip131/get-no-body'
    );

    assert.equal(getBodyFindings.length, 1);
  });

  it('flags missing pagination on list endpoints', () => {
    const spec = {
      paths: {
        '/users': { get: { parameters: [] } },
      },
    };

    const result = reviewSpec(spec);
    const paginationFindings = result.findings.filter(
      (f) => f.ruleId === 'aip158/list-paginated'
    );

    assert.equal(paginationFindings.length, 1);
  });

  it('supports skipRules config', () => {
    const spec = {
      paths: { '/user': {} },
    };

    const reviewer = new OpenAPIReviewer({
      skipRules: ['aip122/plural-resources'],
    });
    const result = reviewer.review(spec);

    const pluralFindings = result.findings.filter(
      (f) => f.ruleId === 'aip122/plural-resources'
    );
    assert.equal(pluralFindings.length, 0);
  });

  it('supports category filtering', () => {
    const spec = {
      paths: { '/user': { get: {} } },
    };

    const reviewer = new OpenAPIReviewer({
      categories: ['naming'],
    });
    const result = reviewer.review(spec);

    // All findings should be naming category
    assert.ok(result.findings.every((f) => f.category === 'naming'));
  });

  it('strict mode promotes warnings to errors', () => {
    const spec = {
      paths: { '/user': {} }, // plural-resources is a warning
    };

    const normal = reviewSpec(spec);
    const strict = reviewSpecStrict(spec);

    const normalWarnings = normal.findings.filter(
      (f) => f.severity === 'warning'
    );
    const strictErrors = strict.findings.filter((f) => f.severity === 'error');

    assert.ok(normalWarnings.length > 0, 'Normal should have warnings');
    assert.ok(strictErrors.length >= normalWarnings.length, 'Strict should promote warnings to errors');
  });
});

// ============================================
// Rule Behavior Tests
// ============================================

describe('Rule behaviors (integration)', () => {
  it('respects version prefix exceptions', () => {
    const spec = { paths: { '/v1/users': {}, '/v2/orders': {} } };
    const result = reviewSpec(spec);

    const versionFindings = result.findings.filter(
      (f) =>
        f.ruleId === 'aip122/plural-resources' &&
        (f.message.includes("'v1'") || f.message.includes("'v2'"))
    );

    assert.equal(versionFindings.length, 0, 'Should not flag version prefixes');
  });

  it('detects singleton resources', () => {
    const spec = {
      paths: {
        '/v1/database/backup': {},
        '/v1/database/restore': {},
        // No /v1/database/{id} path - database is singleton
      },
    };

    const result = reviewSpec(spec);
    const dbFindings = result.findings.filter(
      (f) =>
        f.ruleId === 'aip122/plural-resources' &&
        f.message.includes("'database'")
    );

    assert.equal(dbFindings.length, 0, 'Should not flag singleton resources');
  });

  it('recognizes custom methods', () => {
    const spec = {
      paths: {
        '/v1/passwords': {},
        '/v1/passwords/validate-hash': {},
        '/v1/passwords/validate-crypt': {},
      },
    };

    const result = reviewSpec(spec);
    const verbFindings = result.findings.filter(
      (f) =>
        f.ruleId === 'aip122/no-verbs' &&
        (f.message.includes('validate-hash') ||
          f.message.includes('validate-crypt'))
    );

    assert.equal(verbFindings.length, 0, 'Should not flag custom methods');
  });

  it('allows noun exceptions like checklist', () => {
    const spec = {
      paths: { '/v1/checklists': {}, '/v1/checklists/{id}': {} },
    };

    const result = reviewSpec(spec);
    const verbFindings = result.findings.filter(
      (f) =>
        f.ruleId === 'aip122/no-verbs' && f.message.includes('checklists')
    );

    assert.equal(verbFindings.length, 0, 'Should not flag noun exceptions');
  });
});
