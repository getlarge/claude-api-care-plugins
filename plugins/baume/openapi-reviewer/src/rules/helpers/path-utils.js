// @ts-check
/**
 * Path-related utility functions
 * @module rules/helpers/path-utils
 */

import { isNoun, isUncountable, singularize } from './nlp.js';

/**
 * Common version prefix patterns
 * @type {RegExp[]}
 */
export const VERSION_PATTERNS = [
  /^v\d+$/, // v1, v2, v3
  /^v\d+\.\d+$/, // v1.0, v2.1
  /^api$/, // /api/v1/...
];

/**
 * Singleton/system endpoints that never return collections
 * Yes, this is opinionated.
 * @type {Set<string>}
 */
const SINGLETON_ENDPOINTS = new Set([
  'health',
  'healthz',
  'ready',
  'readyz',
  'live',
  'livez',
  'status',
  'info',
  'version',
  'config',
  'configuration',
  'settings',
  'me',
  'self',
  'current',
  'auth',
  'login',
  'logout',
  'register',
  'verify',
  'refresh',
  'token',
  'callback',
  'webhook',
  'webhooks',
  'metrics',
  'stats',
  'statistics',
  'analytics',
  'ping',
  'echo',
  'debug',
  'swagger',
  'openapi',
  'docs',
  'graphql',
]);

/**
 * Extract path segments that are not parameters
 * @param {string} path - The URL path
 * @returns {string[]} Resource segments (excluding {params} and :custom)
 */
export function getResourceSegments(path) {
  return path
    .split('/')
    .filter((s) => s && !s.startsWith('{') && !s.includes(':'));
}

/**
 * Check if a segment is a version prefix
 * @param {string} segment - Path segment to check
 * @returns {boolean}
 */
export function isVersionPrefix(segment) {
  const lower = segment.toLowerCase();
  return VERSION_PATTERNS.some((pattern) => pattern.test(lower));
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string}
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if path is a collection endpoint that would return a list
 * Uses NLP to determine if the endpoint likely returns multiple items
 * @param {string} path - The URL path
 * @returns {boolean}
 */
export function isCollectionEndpoint(path) {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  // Must have a last segment that's not a parameter or custom method
  if (!last || last.startsWith('{') || last.includes(':')) {
    return false;
  }

  const lower = last.toLowerCase();

  // Skip version prefixes
  if (isVersionPrefix(last)) {
    return false;
  }

  // Skip known singleton/system endpoints
  if (SINGLETON_ENDPOINTS.has(lower)) {
    return false;
  }

  // Skip uncountable nouns (they don't have plural forms)
  if (isUncountable(lower)) {
    return false;
  }

  // Check if the word is a noun and appears to be plural
  // A collection endpoint should end with a plural noun
  if (!isNoun(lower)) {
    return false;
  }

  // Check if it's actually plural (singular form is different)
  const singular = singularize(lower);
  const isPlural = singular.toLowerCase() !== lower;

  return isPlural;
}

/**
 * Detect casing style of a word
 * @param {string} word - Word to analyze
 * @returns {'snake_case' | 'kebab-case' | 'camelCase' | 'PascalCase' | 'lowercase'}
 */
export function detectCasingStyle(word) {
  if (word.includes('_')) return 'snake_case';
  if (word.includes('-')) return 'kebab-case';
  if (/^[a-z]/.test(word) && /[A-Z]/.test(word)) return 'camelCase';
  if (/^[A-Z]/.test(word)) return 'PascalCase';
  return 'lowercase';
}
