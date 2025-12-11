// @ts-check
/**
 * AIP-based OpenAPI Reviewer
 *
 * A modular tool for reviewing OpenAPI specifications against
 * Google's API Improvement Proposals (AIP).
 *
 * @example
 * // As a library
 * import { OpenAPIReviewer, reviewSpec, defaultRules } from 'aip-openapi-reviewer';
 *
 * const spec = { openapi: '3.0.0', paths: { ... } };
 * const result = reviewSpec(spec);
 *
 * console.log(result.findings);
 *
 * @example
 * // Custom configuration
 * import { OpenAPIReviewer } from 'aip-openapi-reviewer';
 *
 * const reviewer = new OpenAPIReviewer({
 *   strict: true,
 *   categories: ['naming', 'pagination'],
 *   skipRules: ['aip122/plural-resources'],
 * });
 *
 * const result = reviewer.review(spec, 'api.yaml');
 *
 * @example
 * // Access the rule registry
 * import { OpenAPIReviewer, defaultRegistry } from 'aip-openapi-reviewer';
 *
 * // Get rules by AIP number
 * const aip122Rules = defaultRegistry.getByAip(122);
 *
 * // Get rules by category
 * const namingRules = defaultRegistry.getByCategory('naming');
 *
 * @example
 * // Custom output format
 * import { reviewSpec, formatMarkdown, formatSARIF } from 'aip-openapi-reviewer';
 *
 * const result = reviewSpec(spec);
 * const markdown = formatMarkdown(result);
 * const sarif = formatSARIF(result);
 *
 * @module aip-openapi-reviewer
 */

// Core reviewer
export { OpenAPIReviewer, reviewSpec, reviewSpecStrict } from './reviewer.js';

// Rules - new modular structure
export {
  // Registry
  defaultRules,
  defaultRegistry,
  RuleRegistry,
  getRulesByCategory,
  getRuleById,
  // Base classes
  BaseRule,
  SpecRule,
  PathRule,
  OperationRule,
  SchemaRule,
  PropertyRule,
  ParameterRule,
  // Helpers
  getResourceSegments,
  isVersionPrefix,
  isCollectionEndpoint,
  findSingletonResources,
  isSingletonPath,
  isCustomMethod,
  isSingular,
  looksLikeVerb,
  getAllOperations,
  hasParameter,
  resolveRef,
  getResponseSchema,
} from './rules/index.js';

// Formatters
export {
  formatJSON,
  formatMarkdown,
  formatConsole,
  formatSARIF,
} from './formatters.js';

// Types are exported via TypeScript declaration files
// For JSDoc users, import types like:
// /** @typedef {import('aip-openapi-reviewer').Finding} Finding */
