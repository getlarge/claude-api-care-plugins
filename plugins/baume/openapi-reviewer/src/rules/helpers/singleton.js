// @ts-check
/**
 * Singleton resource detection utilities
 * @module rules/helpers/singleton
 */

import { isVersionPrefix, escapeRegex } from './path-utils.js';

/**
 * @typedef {import('../../types.ts').OpenAPISpec} OpenAPISpec
 */

/**
 * Analyze spec to find singleton resources (resources without /{id} variants)
 * Also infers implicit singleton parents from nested paths.
 *
 * @param {OpenAPISpec} spec - The OpenAPI specification
 * @returns {Set<string>} Set of singleton resource paths (e.g., "/v1/database")
 */
export function findSingletonResources(spec) {
  const singletons = new Set();
  const paths = Object.keys(spec.paths || {});
  const pathSet = new Set(paths);

  // First pass: find explicit singletons (paths without /{id} children)
  for (const path of paths) {
    // Skip if this path itself has a parameter
    if (path.includes('{')) continue;

    // Check if there's a sibling path with /{id} or /{param}
    const hasIdVariant = paths.some((other) => {
      if (other === path) return false;
      // Match /path/{anything} but not /path/subresource
      const pattern = new RegExp(`^${escapeRegex(path)}/\\{[^/]+\\}$`);
      return pattern.test(other);
    });

    if (!hasIdVariant && path !== '/') {
      singletons.add(path);
    }
  }

  // Second pass: infer implicit singleton parents
  // If we see /v1/database/backup but no /v1/database/{id} and no /v1/database,
  // then /v1/database is an implicit singleton
  for (const path of paths) {
    if (path.includes('{')) continue;

    const segments = path.split('/').filter(Boolean);
    // Build parent paths progressively
    for (let i = 1; i < segments.length; i++) {
      const parentPath = '/' + segments.slice(0, i).join('/');

      // Skip if parent path explicitly exists (handled in first pass)
      if (pathSet.has(parentPath)) continue;

      // Skip version prefixes
      if (segments[i - 1] && isVersionPrefix(segments[i - 1])) continue;

      // Check if parent has an {id} variant anywhere
      const parentHasIdVariant = paths.some((other) => {
        const pattern = new RegExp(`^${escapeRegex(parentPath)}/\\{[^/]+\\}`);
        return pattern.test(other);
      });

      if (!parentHasIdVariant) {
        singletons.add(parentPath);
      }
    }
  }

  return singletons;
}

/**
 * Check if a path is or is under a singleton resource
 * @param {string} pathToCheck - Path to check
 * @param {Set<string>} singletons - Set of known singleton paths
 * @returns {boolean}
 */
export function isSingletonPath(pathToCheck, singletons) {
  // Direct match
  if (singletons.has(pathToCheck)) return true;

  // Check if any singleton is a prefix of this path
  for (const singleton of singletons) {
    if (pathToCheck.startsWith(singleton + '/')) return true;
  }

  return false;
}
