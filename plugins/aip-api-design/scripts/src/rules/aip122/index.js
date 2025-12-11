// @ts-check
/**
 * AIP-122: Resource Names
 *
 * Rules for resource naming conventions.
 *
 * @see https://google.aip.dev/122
 * @module rules/aip122
 */

export { pluralResources, PluralResourcesRule } from './plural-resources.js';
export { noVerbs, NoVerbsRule } from './no-verbs.js';
export { consistentCasing, ConsistentCasingRule } from './consistent-casing.js';
export { nestedOwnership, NestedOwnershipRule } from './nested-ownership.js';

// Export all rules as array for convenience
import { pluralResources } from './plural-resources.js';
import { noVerbs } from './no-verbs.js';
import { consistentCasing } from './consistent-casing.js';
import { nestedOwnership } from './nested-ownership.js';

export const rules = [pluralResources, noVerbs, consistentCasing, nestedOwnership];
