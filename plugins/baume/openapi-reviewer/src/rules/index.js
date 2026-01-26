// @ts-check
/**
 * Rule Registry and Exports
 *
 * Central registry for all AIP rules, organized by AIP number.
 *
 * @module rules
 */

import {
  BaseRule,
  SpecRule,
  PathRule,
  OperationRule,
  SchemaRule,
  PropertyRule,
  ParameterRule,
} from './base.js';

// Re-export base classes
export {
  BaseRule,
  SpecRule,
  PathRule,
  OperationRule,
  SchemaRule,
  PropertyRule,
  ParameterRule,
};

// Re-export helpers
export * from './helpers/index.js';

// Import all AIP rules
import { rules as aip122Rules } from './aip122/index.js';
import { rules as aip131Rules } from './aip131/index.js';
import { rules as aip132Rules } from './aip132/index.js';
import { rules as aip133Rules } from './aip133/index.js';
import { rules as aip134Rules } from './aip134/index.js';
import { rules as aip135Rules } from './aip135/index.js';
import { rules as aip155Rules } from './aip155/index.js';
import { rules as aip158Rules } from './aip158/index.js';
import { rules as aip193Rules } from './aip193/index.js';

/**
 * @typedef {import('../types.ts').RuleCategory} RuleCategory
 */

/**
 * Rule Registry - manages all AIP rules
 */
export class RuleRegistry {
  /** @type {Map<number, BaseRule[]>} */
  #rules = new Map();

  /**
   * Register rules for an AIP
   * @param {number} aip - AIP number (e.g., 122)
   * @param {...BaseRule} rules - Rules to register
   */
  register(aip, ...rules) {
    const existing = this.#rules.get(aip) || [];
    this.#rules.set(aip, [...existing, ...rules]);
  }

  /**
   * Get all registered rules
   * @returns {BaseRule[]}
   */
  getAll() {
    return [...this.#rules.values()].flat();
  }

  /**
   * Get rules by AIP number
   * @param {number} aip - AIP number
   * @returns {BaseRule[]}
   */
  getByAip(aip) {
    return this.#rules.get(aip) || [];
  }

  /**
   * Get rules by category
   * @param {RuleCategory} category
   * @returns {BaseRule[]}
   */
  getByCategory(category) {
    return this.getAll().filter((r) => r.category === category);
  }

  /**
   * Get rule by ID
   * @param {string} id - Rule ID (e.g., "aip122/plural-resources")
   * @returns {BaseRule | undefined}
   */
  getById(id) {
    return this.getAll().find((r) => r.id === id);
  }

  /**
   * Get rules by type
   * @param {typeof SpecRule | typeof PathRule | typeof OperationRule | typeof SchemaRule | typeof PropertyRule | typeof ParameterRule} ruleClass
   * @returns {BaseRule[]}
   */
  getByType(ruleClass) {
    return this.getAll().filter((r) => r instanceof ruleClass);
  }

  /**
   * Get all registered AIP numbers
   * @returns {number[]}
   */
  getAips() {
    return [...this.#rules.keys()].sort((a, b) => a - b);
  }

  /**
   * Get rule count
   * @returns {number}
   */
  get size() {
    return this.getAll().length;
  }
}

// Create and populate default registry
export const defaultRegistry = new RuleRegistry();

// Register all AIP rules
defaultRegistry.register(122, ...aip122Rules);
defaultRegistry.register(131, ...aip131Rules);
defaultRegistry.register(132, ...aip132Rules);
defaultRegistry.register(133, ...aip133Rules);
defaultRegistry.register(134, ...aip134Rules);
defaultRegistry.register(135, ...aip135Rules);
defaultRegistry.register(155, ...aip155Rules);
defaultRegistry.register(158, ...aip158Rules);
defaultRegistry.register(193, ...aip193Rules);

/**
 * Get rules by category (backward-compat helper)
 * @param {RuleCategory[]} categories
 * @returns {BaseRule[]}
 */
export function getRulesByCategory(categories) {
  return defaultRegistry
    .getAll()
    .filter((rule) => categories.includes(rule.category));
}

/**
 * Get a rule by ID (backward-compat helper)
 * @param {string} id
 * @returns {BaseRule | undefined}
 */
export function getRuleById(id) {
  return defaultRegistry.getById(id);
}

// Backward-compat export - returns all rules as array
export const defaultRules = defaultRegistry.getAll();
