// @ts-check
/**
 * Naming and grammar utilities
 * @module rules/helpers/naming
 */

import { isVerb as nlpIsVerb, isNoun, singularize } from './nlp.js';

/**
 * Common action verbs used in custom methods (AIP-136)
 * These are API-specific action verbs, not general language rules
 * @type {Set<string>}
 */
export const CUSTOM_METHOD_VERBS = new Set([
  'validate',
  'verify',
  'check',
  'test',
  'export',
  'import',
  'download',
  'upload',
  'clear',
  'reset',
  'restore',
  'backup',
  'start',
  'stop',
  'pause',
  'resume',
  'enable',
  'disable',
  'toggle',
  'send',
  'publish',
  'notify',
  'archive',
  'unarchive',
  'approve',
  'reject',
  'cancel',
  'encrypt',
  'decrypt',
  'hash',
  'sync',
  'refresh',
  'reload',
  'train',
  'predict',
]);

/**
 * Check if a path segment looks like a custom method (AIP-136)
 * Custom methods are verb-based actions, often hyphenated
 *
 * @param {string} segment - Path segment to check
 * @param {string} path - Full path for context
 * @param {Set<string>} singletons - Set of singleton resource paths
 * @returns {boolean}
 */
export function isCustomMethod(segment, path, singletons) {
  // Colon-prefixed custom methods are already handled
  if (segment.includes(':')) return true;

  const lower = segment.toLowerCase();

  // Check for hyphenated custom methods (e.g., validate-hash)
  if (lower.includes('-')) {
    const parts = lower.split('-');
    // If first part is a verb, it's likely a custom method
    if (CUSTOM_METHOD_VERBS.has(parts[0])) return true;
  }

  // Check for verb-only segments on singletons or as terminal actions
  if (CUSTOM_METHOD_VERBS.has(lower)) {
    // Get parent path by removing last segment
    const parentPath = path.substring(0, path.lastIndexOf('/'));
    // If parent is a singleton, this is likely a custom method
    if (singletons.has(parentPath)) return true;
    // If parent has an {id} parameter, this could be an action on a resource
    if (parentPath.includes('{')) return true;
  }

  return false;
}

/**
 * Common verb prefixes that indicate bad REST naming
 * (e.g., /getUsers instead of GET /users)
 * @type {RegExp}
 */
const VERB_PREFIX_PATTERN =
  /^(get|fetch|create|add|update|edit|delete|remove|list|find|search|retrieve)/i;

/**
 * Check if a word looks like a verb using NLP
 * Also detects common verb prefixes in compound words (e.g., getUsers)
 * @param {string} word - Word to check
 * @returns {boolean}
 */
export function looksLikeVerb(word) {
  // First, check for common verb prefixes (catches getUsers, createOrder, etc.)
  // These patterns indicate incorrect REST naming (using verbs instead of HTTP methods)
  if (VERB_PREFIX_PATTERN.test(word)) {
    return true;
  }

  // Use NLP-based detection for plain verbs
  // Returns true only if it's a verb and NOT a noun
  return nlpIsVerb(word) && !isNoun(word);
}

/**
 * Check if a word is likely singular using NLP
 * @param {string} word - Word to check
 * @returns {boolean}
 */
export function isSingular(word) {
  const singular = singularize(word);
  return singular.toLowerCase() === word.toLowerCase();
}
