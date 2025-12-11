// @ts-check
/**
 * AIP-based OpenAPI Reviewer
 *
 * Uses typed rule dispatch to efficiently run rules on the appropriate
 * OpenAPI elements (spec, paths, operations, schemas, parameters).
 *
 * @module reviewer
 */

import {
  defaultRules,
  defaultRegistry,
  getRulesByCategory,
  BaseRule,
  SpecRule,
  PathRule,
  OperationRule,
  SchemaRule,
  PropertyRule,
  ParameterRule,
  getAllOperations,
} from './rules/index.js';

/**
 * @typedef {import('./types.js').OpenAPISpec} OpenAPISpec
 * @typedef {import('./types.js').Finding} Finding
 * @typedef {import('./types.js').ReviewResult} ReviewResult
 * @typedef {import('./types.js').ReviewerConfig} ReviewerConfig
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleContext} RuleContext
 * @typedef {import('./types.js').RuleCategory} RuleCategory
 */

const REVIEWER_VERSION = '2.0.0';

/**
 * OpenAPI Reviewer that checks specs against AIP principles
 * using typed rule dispatch for efficient execution.
 */
export class OpenAPIReviewer {
  /** @type {BaseRule[]} */
  #rules;

  /** @type {ReviewerConfig} */
  #config;

  /**
   * Create a new reviewer instance
   * @param {ReviewerConfig} [config={}] - Configuration options
   */
  constructor(config = {}) {
    this.#config = config;
    this.#rules = this.#buildRuleSet(config);
  }

  /**
   * Build the set of rules to apply based on config
   * @param {ReviewerConfig} config
   * @returns {BaseRule[]}
   */
  #buildRuleSet(config) {
    /** @type {BaseRule[]} */
    let rules = [...defaultRules];

    // Filter by category if specified
    if (config.categories && config.categories.length > 0) {
      rules = getRulesByCategory(config.categories);
    }

    // Remove skipped rules
    if (config.skipRules && config.skipRules.length > 0) {
      const skipSet = new Set(config.skipRules);
      rules = rules.filter((r) => !skipSet.has(r.id));
    }

    // Add custom rules (legacy Rule interface support)
    if (config.customRules) {
      // Wrap legacy rules in a SpecRule-like interface
      for (const legacyRule of config.customRules) {
        const wrapper = new LegacyRuleWrapper(legacyRule);
        rules.push(wrapper);
      }
    }

    return rules;
  }

  /**
   * Review an OpenAPI spec using typed rule dispatch
   * @param {OpenAPISpec} spec - The OpenAPI specification to review
   * @param {string} [specPath='<inline>'] - Path to the spec file (for reporting)
   * @returns {ReviewResult}
   */
  review(spec, specPath = '<inline>') {
    /** @type {Finding[]} */
    const allFindings = [];

    // Group rules by type for efficient dispatch
    const specRules = this.#rules.filter((r) => r instanceof SpecRule);
    const pathRules = this.#rules.filter((r) => r instanceof PathRule);
    const operationRules = this.#rules.filter((r) => r instanceof OperationRule);
    const schemaRules = this.#rules.filter((r) => r instanceof SchemaRule);
    const propertyRules = this.#rules.filter((r) => r instanceof PropertyRule);
    const parameterRules = this.#rules.filter((r) => r instanceof ParameterRule);

    // Run SpecRules (once per spec)
    for (const rule of specRules) {
      const ctx = this.#createRuleContext(rule, spec);
      try {
        const findings = /** @type {SpecRule} */ (rule).checkSpec(spec, ctx);
        allFindings.push(...findings);
      } catch (error) {
        this.#logRuleError(rule, error);
      }
    }

    // Run PathRules (for each path)
    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      for (const rule of pathRules) {
        const ctx = this.#createRuleContext(rule, spec);
        try {
          const findings = /** @type {PathRule} */ (rule).checkPath(
            path,
            pathItem,
            spec,
            ctx
          );
          allFindings.push(...findings);
        } catch (error) {
          this.#logRuleError(rule, error);
        }
      }
    }

    // Run OperationRules (for each operation)
    const operations = getAllOperations(spec);
    for (const { path, method, operation } of operations) {
      for (const rule of operationRules) {
        // Check method filter if specified
        const opRule = /** @type {OperationRule} */ (rule);
        if (opRule.methods && !opRule.methods.includes(method)) continue;

        const ctx = this.#createRuleContext(rule, spec);
        try {
          const findings = opRule.checkOperation(method, operation, path, spec, ctx);
          allFindings.push(...findings);
        } catch (error) {
          this.#logRuleError(rule, error);
        }
      }

      // Run ParameterRules (for each parameter in operation)
      for (const param of operation.parameters || []) {
        for (const rule of parameterRules) {
          // Check location filter if specified
          const paramRule = /** @type {ParameterRule} */ (rule);
          if (paramRule.locations && !paramRule.locations.includes(param.in)) continue;

          const ctx = this.#createRuleContext(rule, spec);
          try {
            const findings = paramRule.checkParameter(param, method, path, spec, ctx);
            allFindings.push(...findings);
          } catch (error) {
            this.#logRuleError(rule, error);
          }
        }
      }
    }

    // Run SchemaRules (for each schema in components)
    for (const [schemaName, schema] of Object.entries(
      spec.components?.schemas || {}
    )) {
      for (const rule of schemaRules) {
        const ctx = this.#createRuleContext(rule, spec);
        try {
          const findings = /** @type {SchemaRule} */ (rule).checkSchema(
            schemaName,
            schema,
            spec,
            ctx
          );
          allFindings.push(...findings);
        } catch (error) {
          this.#logRuleError(rule, error);
        }
      }

      // Run PropertyRules (for each property in schema)
      for (const [propertyName, property] of Object.entries(
        schema.properties || {}
      )) {
        for (const rule of propertyRules) {
          const ctx = this.#createRuleContext(rule, spec);
          try {
            const findings = /** @type {PropertyRule} */ (rule).checkProperty(
              propertyName,
              property,
              schemaName,
              spec,
              ctx
            );
            allFindings.push(...findings);
          } catch (error) {
            this.#logRuleError(rule, error);
          }
        }
      }
    }

    // Promote warnings to errors in strict mode
    if (this.#config.strict) {
      for (const finding of allFindings) {
        if (finding.severity === 'warning') {
          finding.severity = 'error';
        }
      }
    }

    // Build summary
    const summary = this.#buildSummary(allFindings);

    return {
      specPath,
      specTitle: spec.info?.title,
      specVersion: spec.info?.version,
      findings: allFindings,
      summary,
      metadata: {
        reviewedAt: new Date().toISOString(),
        reviewerVersion: REVIEWER_VERSION,
        rulesApplied: this.#rules.map((r) => r.id),
      },
    };
  }

  /**
   * Log rule error
   * @param {BaseRule} rule
   * @param {unknown} error
   */
  #logRuleError(rule, error) {
    if (error instanceof Error) {
      console.error(`Rule ${rule.id} threw error:`, error.message);
    } else {
      console.error(`Rule ${rule.id} threw unknown error:`, error);
    }
  }

  /**
   * Create context for a rule
   * @param {BaseRule} rule
   * @param {OpenAPISpec} spec
   * @returns {RuleContext}
   */
  #createRuleContext(rule, spec) {
    return {
      spec,
      createFinding: (partial) => ({
        ruleId: rule.id,
        severity: rule.severity,
        category: rule.category,
        aip: rule.aip,
        ...partial,
      }),
    };
  }

  /**
   * Build summary from findings
   * @param {Finding[]} findings
   * @returns {ReviewResult['summary']}
   */
  #buildSummary(findings) {
    /** @type {Record<RuleCategory, number>} */
    const byCategory = {
      naming: 0,
      'standard-methods': 0,
      errors: 0,
      pagination: 0,
      filtering: 0,
      lro: 0,
      idempotency: 0,
      versioning: 0,
      security: 0,
    };

    let errors = 0;
    let warnings = 0;
    let suggestions = 0;

    for (const finding of findings) {
      byCategory[finding.category]++;

      switch (finding.severity) {
        case 'error':
          errors++;
          break;
        case 'warning':
          warnings++;
          break;
        case 'suggestion':
          suggestions++;
          break;
      }
    }

    return { errors, warnings, suggestions, byCategory };
  }

  /**
   * Get the list of rules this reviewer will apply
   * @returns {BaseRule[]}
   */
  getRules() {
    return [...this.#rules];
  }

  /**
   * Get the rule registry for advanced queries
   * @returns {typeof defaultRegistry}
   */
  static getRegistry() {
    return defaultRegistry;
  }
}

/**
 * Wrapper to support legacy Rule interface in the new system
 */
class LegacyRuleWrapper extends SpecRule {
  /** @type {Rule} */
  #legacyRule;

  /**
   * @param {Rule} legacyRule
   */
  constructor(legacyRule) {
    super({
      id: legacyRule.id,
      name: legacyRule.name,
      aip: legacyRule.aip,
      severity: legacyRule.severity,
      description: legacyRule.description,
    });
    this.#legacyRule = legacyRule;
  }

  /** @override */
  get category() {
    return this.#legacyRule.category;
  }

  /**
   * @param {OpenAPISpec} spec
   * @param {RuleContext} ctx
   * @returns {Finding[]}
   */
  checkSpec(spec, ctx) {
    return this.#legacyRule.check(spec, ctx);
  }
}

/**
 * Convenience function to review a spec with default config
 * @param {OpenAPISpec} spec
 * @param {string} [specPath]
 * @returns {ReviewResult}
 */
export function reviewSpec(spec, specPath) {
  const reviewer = new OpenAPIReviewer();
  return reviewer.review(spec, specPath);
}

/**
 * Convenience function to review with strict mode
 * @param {OpenAPISpec} spec
 * @param {string} [specPath]
 * @returns {ReviewResult}
 */
export function reviewSpecStrict(spec, specPath) {
  const reviewer = new OpenAPIReviewer({ strict: true });
  return reviewer.review(spec, specPath);
}
