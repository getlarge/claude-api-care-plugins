// @ts-check
/**
 * AIP-122/131: No Verbs in Path
 *
 * Paths should use nouns, not verbs. Custom methods (AIP-136) are exceptions.
 *
 * @see https://google.aip.dev/122
 * @see https://google.aip.dev/131
 * @module rules/aip122/no-verbs
 */

import { PathRule } from '../base.js';
import {
  getResourceSegments,
  isVersionPrefix,
  isCustomMethod,
  findSingletonResources,
  looksLikeVerb,
} from '../helpers/index.js';

/**
 * @typedef {import('../../types.ts').OpenAPISpec} OpenAPISpec
 */

/**
 * Rule: No verbs in resource paths
 */
export class NoVerbsRule extends PathRule {
  /** @type {WeakMap<OpenAPISpec, Set<string>>} */
  #singletonCache = new WeakMap();

  constructor() {
    super({
      id: 'aip122/no-verbs',
      name: 'No Verbs in Path',
      aip: 'AIP-131',
      severity: 'error',
      description:
        'Paths should use nouns, not verbs. Custom methods (AIP-136) are exceptions.',
      category: 'naming', // Override: this is a naming rule despite referencing AIP-131
    });
  }

  /**
   * @param {string} path
   * @param {import('../../types.ts').PathItem} pathItem
   * @param {OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkPath(path, pathItem, spec, ctx) {
    const findings = [];

    // Get or compute singletons (cached per spec)
    let singletons = this.#singletonCache.get(spec);
    if (!singletons) {
      singletons = findSingletonResources(spec);
      this.#singletonCache.set(spec, singletons);
    }

    for (const segment of getResourceSegments(path)) {
      // Skip colon-prefixed custom method suffixes (e.g., :cancel, :publish)
      if (segment.includes(':')) continue;

      // Skip version prefixes
      if (isVersionPrefix(segment)) continue;

      // Skip recognized custom methods (AIP-136)
      if (isCustomMethod(segment, path, singletons)) continue;

      if (looksLikeVerb(segment)) {
        findings.push(
          ctx.createFinding({
            path,
            message: `Path contains verb '${segment}'. Use nouns for resources.`,
            suggestion: `Extract the noun (e.g., '${
              segment
                .replace(
                  /^(get|fetch|create|add|update|delete|remove|list|find|search)/i,
                  ''
                )
                .toLowerCase() || 'resource'
            }')`,
            context: { segment },
          })
        );
      }
    }

    return findings;
  }
}

export const noVerbs = new NoVerbsRule();
