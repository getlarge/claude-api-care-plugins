/**
 * Tests for Review Output Formatters
 * Run with: node --test src/formatters.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatMarkdown, formatJSON, formatSARIF } from './formatters.js';

/**
 * Create a mock review result for testing
 * @param {object} overrides
 * @returns {import('./types.js').ReviewResult}
 */
function createMockResult(overrides = {}) {
  return {
    specPath: 'test-api.yaml',
    specTitle: 'Test API',
    specVersion: '1.0.0',
    findings: [],
    summary: {
      errors: 0,
      warnings: 0,
      suggestions: 0,
      byCategory: {
        naming: 0,
        'standard-methods': 0,
        errors: 0,
        pagination: 0,
        filtering: 0,
        lro: 0,
        idempotency: 0,
        versioning: 0,
        security: 0,
      },
    },
    metadata: {
      reviewedAt: '2025-01-01T00:00:00.000Z',
      reviewerVersion: '2.0.0',
      rulesApplied: ['aip122/plural-resources'],
    },
    ...overrides,
  };
}

/**
 * Create a mock finding
 * @param {object} overrides
 * @returns {import('./types.js').Finding}
 */
function createMockFinding(overrides = {}) {
  return {
    ruleId: 'aip122/plural-resources',
    severity: 'warning',
    category: 'naming',
    path: '/user/{id}',
    message: "Resource name 'user' appears singular",
    aip: 'AIP-122',
    suggestion: "Rename to 'users'",
    fix: {
      type: 'rename-path-segment',
      jsonPath: "$.paths['/user/{id}']",
      target: { segment: 'user', segmentIndex: 0 },
      replacement: 'users',
      specChanges: [
        {
          operation: 'rename-key',
          path: '$.paths',
          from: '/user/{id}',
          to: '/users/{id}',
        },
      ],
    },
    ...overrides,
  };
}

// ============================================
// formatMarkdown Tests
// ============================================

describe('formatMarkdown', () => {
  it('includes basic header information', () => {
    const result = createMockResult();
    const output = formatMarkdown(result);

    assert.ok(output.includes('## API Review: test-api.yaml'));
    assert.ok(output.includes('**Title:** Test API'));
    assert.ok(output.includes('**Version:** 1.0.0'));
  });

  it('groups findings by severity', () => {
    const result = createMockResult({
      findings: [
        createMockFinding({ severity: 'error', ruleId: 'rule1' }),
        createMockFinding({ severity: 'warning', ruleId: 'rule2' }),
        createMockFinding({ severity: 'suggestion', ruleId: 'rule3' }),
      ],
      summary: { errors: 1, warnings: 1, suggestions: 1 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('### 🔴 Errors (MUST fix)'));
    assert.ok(output.includes('### 🟡 Warnings (SHOULD fix)'));
    assert.ok(output.includes('### 💡 Suggestions (MAY improve)'));
  });

  it('shows success message when no findings', () => {
    const result = createMockResult({ findings: [] });
    const output = formatMarkdown(result);

    assert.ok(output.includes('### ✅ No issues found!'));
  });

  it('includes rule ID in finding output', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('**Rule:** `aip122/plural-resources`'));
  });

  it('includes AIP reference in finding output', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('**Reference:** AIP-122'));
  });

  it('includes suggestion in finding output', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes("**Suggestion:** Rename to 'users'"));
  });
});

describe('formatMarkdown fix blocks', () => {
  it('includes collapsible fix details block', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('<details>'));
    assert.ok(output.includes('<summary>Machine-readable fix</summary>'));
    assert.ok(output.includes('</details>'));
  });

  it('includes fix type in YAML block', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('type: rename-path-segment'));
  });

  it('includes jsonPath in YAML block', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('jsonPath: "$.paths[\'/user/{id}\']"'));
  });

  it('includes specChanges in YAML block', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('specChanges:'));
    assert.ok(output.includes('operation: rename-key'));
    assert.ok(output.includes('from: "/user/{id}"'));
    assert.ok(output.includes('to: "/users/{id}"'));
  });

  it('includes target information when present', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('target:'));
    assert.ok(output.includes('segment: user'));
  });

  it('includes replacement when present', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('replacement: users'));
  });

  it('handles complex replacement objects', () => {
    const finding = createMockFinding({
      ruleId: 'aip155/idempotency-key',
      fix: {
        type: 'add-parameter',
        jsonPath: "$.paths['/users'].post.parameters",
        replacement: {
          name: 'Idempotency-Key',
          in: 'header',
          required: false,
          schema: { type: 'string' },
        },
        specChanges: [
          {
            operation: 'add',
            path: "$.paths['/users'].post.parameters",
            value: { name: 'Idempotency-Key', in: 'header' },
          },
        ],
      },
    });
    const result = createMockResult({
      findings: [finding],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('replacement:'));
    assert.ok(output.includes('name: Idempotency-Key'));
    assert.ok(output.includes('in: header'));
  });

  it('handles array replacement values', () => {
    const finding = createMockFinding({
      ruleId: 'aip158/list-paginated',
      fix: {
        type: 'add-parameters',
        jsonPath: "$.paths['/users'].get.parameters",
        replacement: [
          { name: 'page_size', in: 'query' },
          { name: 'page_token', in: 'query' },
        ],
        specChanges: [],
      },
    });
    const result = createMockResult({
      findings: [finding],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(output.includes('replacement:'));
    assert.ok(output.includes('name: page_size'));
    assert.ok(output.includes('name: page_token'));
  });

  it('omits fix block when no fix present', () => {
    const finding = createMockFinding();
    delete finding.fix;

    const result = createMockResult({
      findings: [finding],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatMarkdown(result);

    assert.ok(!output.includes('<details>'));
    assert.ok(!output.includes('Machine-readable fix'));
  });
});

// ============================================
// formatJSON Tests
// ============================================

describe('formatJSON', () => {
  it('outputs valid JSON', () => {
    const result = createMockResult();
    const output = formatJSON(result);
    const parsed = JSON.parse(output);

    assert.equal(parsed.specPath, 'test-api.yaml');
  });

  it('includes fix objects in JSON output', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatJSON(result);
    const parsed = JSON.parse(output);

    assert.ok(parsed.findings[0].fix);
    assert.equal(parsed.findings[0].fix.type, 'rename-path-segment');
  });
});

// ============================================
// formatSARIF Tests
// ============================================

describe('formatSARIF', () => {
  it('outputs valid SARIF JSON', () => {
    const result = createMockResult({
      findings: [createMockFinding()],
      summary: { errors: 0, warnings: 1, suggestions: 0 },
    });
    const output = formatSARIF(result);
    const parsed = JSON.parse(output);

    assert.equal(parsed.version, '2.1.0');
    assert.ok(parsed.runs);
    assert.ok(parsed.runs[0].tool);
    assert.ok(parsed.runs[0].results);
  });

  it('converts severity to SARIF levels', () => {
    const result = createMockResult({
      findings: [
        createMockFinding({ severity: 'error' }),
        createMockFinding({ severity: 'warning', ruleId: 'rule2' }),
        createMockFinding({ severity: 'suggestion', ruleId: 'rule3' }),
      ],
      summary: { errors: 1, warnings: 1, suggestions: 1 },
    });
    const output = formatSARIF(result);
    const parsed = JSON.parse(output);

    const levels = parsed.runs[0].results.map(
      (/** @type {{ level: string }} */ r) => r.level
    );
    assert.ok(levels.includes('error'));
    assert.ok(levels.includes('warning'));
    assert.ok(levels.includes('note')); // suggestion -> note
  });
});
