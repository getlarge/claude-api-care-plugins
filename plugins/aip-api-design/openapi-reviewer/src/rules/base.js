// @ts-check
/**
 * Base Rule Classes for OpenAPI Review
 *
 * Typed rule system inspired by Google's api-linter.
 * Each rule type runs on a specific OpenAPI element.
 *
 * @module rules/base
 */

/**
 * @typedef {import('../types.ts').Finding} Finding
 * @typedef {import('../types.ts').OpenAPISpec} OpenAPISpec
 * @typedef {import('../types.ts').RuleContext} RuleContext
 * @typedef {import('../types.ts').PathItem} PathItem
 * @typedef {import('../types.ts').Operation} Operation
 * @typedef {import('../types.ts').Schema} Schema
 * @typedef {import('../types.ts').Parameter} Parameter
 * @typedef {import('../types.ts').Severity} Severity
 * @typedef {import('../types.ts').RuleCategory} RuleCategory
 */

/**
 * Map AIP numbers to categories
 * @type {Record<string, RuleCategory>}
 */
const AIP_CATEGORIES = {
  122: 'naming',
  123: 'naming',
  131: 'standard-methods',
  132: 'standard-methods',
  133: 'standard-methods',
  134: 'standard-methods',
  135: 'standard-methods',
  136: 'standard-methods',
  155: 'idempotency',
  158: 'pagination',
  160: 'filtering',
  193: 'errors',
  194: 'errors',
};

/**
 * Base class for all rules
 */
export class BaseRule {
  /** @type {string} */
  id;

  /** @type {string} */
  name;

  /** @type {string | undefined} */
  aip;

  /** @type {Severity} */
  severity;

  /** @type {string} */
  description;

  /** @type {RuleCategory | undefined} */
  #categoryOverride;

  /**
   * @param {Object} config
   * @param {string} config.id - Unique rule identifier (e.g., "aip122/plural-resources")
   * @param {string} config.name - Human-readable name
   * @param {string} [config.aip] - AIP reference (e.g., "AIP-122")
   * @param {Severity} config.severity - Default severity
   * @param {string} config.description - Description of what the rule checks
   * @param {RuleCategory} [config.category] - Override derived category
   */
  constructor({ id, name, aip, severity, description, category }) {
    this.id = id;
    this.name = name;
    this.aip = aip;
    this.severity = severity;
    this.description = description;
    this.#categoryOverride = category;
  }

  /**
   * Get rule category (override or derived from AIP number)
   * @returns {RuleCategory}
   */
  get category() {
    if (this.#categoryOverride) return this.#categoryOverride;
    if (!this.aip) return 'naming'; // default
    const aipNum = this.aip.replace('AIP-', '');
    return AIP_CATEGORIES[aipNum] || 'naming';
  }

  /**
   * Get the rule type name (for dispatch)
   * @returns {string}
   */
  get ruleType() {
    return this.constructor.name;
  }
}

/**
 * Rule that runs once per spec
 * Use for rules that need to analyze the entire spec at once
 * (e.g., checking for consistent error schema, analyzing all paths together)
 */
export class SpecRule extends BaseRule {
  /**
   * Check the entire OpenAPI spec
   * @param {OpenAPISpec} _spec - The OpenAPI specification
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkSpec(_spec, _ctx) {
    throw new Error('checkSpec must be implemented');
  }
}

/**
 * Rule that runs for each path in the spec
 * Use for rules that analyze path patterns
 * (e.g., resource naming, URL structure)
 */
export class PathRule extends BaseRule {
  /**
   * Check a single path
   * @param {string} _path - The path (e.g., "/users/{id}")
   * @param {PathItem} _pathItem - The path item object
   * @param {OpenAPISpec} _spec - Full spec for context
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkPath(_path, _pathItem, _spec, _ctx) {
    throw new Error('checkPath must be implemented');
  }
}

/**
 * Rule that runs for each operation (HTTP method) in the spec
 * Use for rules that analyze individual operations
 * (e.g., GET should not have body, POST should return 201)
 */
export class OperationRule extends BaseRule {
  /**
   * Optional filter: only run on specific HTTP methods
   * @type {string[] | undefined}
   */
  methods;

  /**
   * Check a single operation
   * @param {string} _method - HTTP method (GET, POST, etc.)
   * @param {Operation} _operation - The operation object
   * @param {string} _path - The path this operation belongs to
   * @param {OpenAPISpec} _spec - Full spec for context
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkOperation(_method, _operation, _path, _spec, _ctx) {
    throw new Error('checkOperation must be implemented');
  }
}

/**
 * Rule that runs for each schema in components/schemas
 * Use for rules that analyze schema definitions
 * (e.g., naming conventions, required fields)
 */
export class SchemaRule extends BaseRule {
  /**
   * Check a single schema
   * @param {string} _schemaName - The schema name
   * @param {Schema} _schema - The schema object
   * @param {OpenAPISpec} _spec - Full spec for context
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkSchema(_schemaName, _schema, _spec, _ctx) {
    throw new Error('checkSchema must be implemented');
  }
}

/**
 * Rule that runs for each property in a schema
 * Use for rules that analyze field-level patterns
 * (e.g., field naming, type conventions)
 */
export class PropertyRule extends BaseRule {
  /**
   * Check a single property
   * @param {string} _propertyName - The property name
   * @param {Schema} _property - The property schema
   * @param {string} _schemaName - Parent schema name
   * @param {OpenAPISpec} _spec - Full spec for context
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkProperty(_propertyName, _property, _schemaName, _spec, _ctx) {
    throw new Error('checkProperty must be implemented');
  }
}

/**
 * Rule that runs for each parameter
 * Use for rules that analyze parameter definitions
 * (e.g., pagination parameters, naming conventions)
 */
export class ParameterRule extends BaseRule {
  /**
   * Optional filter: only run on specific parameter locations
   * @type {('query' | 'header' | 'path' | 'cookie')[] | undefined}
   */
  locations;

  /**
   * Check a single parameter
   * @param {Parameter} _param - The parameter
   * @param {string} _method - HTTP method
   * @param {string} _path - The path
   * @param {OpenAPISpec} _spec - Full spec for context
   * @param {RuleContext} _ctx - Rule context with helpers
   * @returns {Finding[]}
   */
  checkParameter(_param, _method, _path, _spec, _ctx) {
    throw new Error('checkParameter must be implemented');
  }
}
