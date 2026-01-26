// @ts-check
/**
 * AIP-122: Plural Resource Names
 *
 * Resource names should be plural nouns (except singletons per AIP-156).
 *
 * @see https://google.aip.dev/122
 * @module rules/aip122/plural-resources
 */

import { PathRule } from '../base.js';
import {
  getResourceSegments,
  isVersionPrefix,
  isCustomMethod,
  findSingletonResources,
  isSingletonPath,
  isSingular,
  pluralize,
  pathToJsonPath,
  computeRenamedPath,
} from '../helpers/index.js';

/**
 * @typedef {import('../../types.ts').OpenAPISpec} OpenAPISpec
 */

/**
 * Rule: Resource names should be plural nouns
 */
export class PluralResourcesRule extends PathRule {
  /** @type {WeakMap<OpenAPISpec, Set<string>>} */
  #singletonCache = new WeakMap();

  constructor() {
    super({
      id: 'aip122/plural-resources',
      name: 'Plural Resource Names',
      aip: 'AIP-122',
      severity: 'warning',
      description:
        'Resource names should be plural nouns (except singletons per AIP-156)',
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

    const segments = getResourceSegments(path);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // Skip version prefixes
      if (isVersionPrefix(segment)) continue;

      // Skip custom methods
      if (isCustomMethod(segment, path, singletons)) continue;

      // Build path up to this segment to check singleton status
      const pathToSegment = '/' + segments.slice(0, i + 1).join('/');

      // Skip if this is a known singleton resource
      if (isSingletonPath(pathToSegment, singletons)) continue;

      if (isSingular(segment)) {
        const suggestedPlural = pluralize(segment);
        const newPath = computeRenamedPath(path, segment, suggestedPlural);
        findings.push(
          ctx.createFinding({
            path,
            message: `Resource name '${segment}' appears singular. Use plural form.`,
            suggestion: `Rename to '${suggestedPlural}' or appropriate plural`,
            context: { segment, suggestedFix: suggestedPlural },
            fix: {
              type: 'rename-path-segment',
              jsonPath: pathToJsonPath(path),
              target: { segment, segmentIndex: i },
              replacement: suggestedPlural,
              specChanges: [
                {
                  operation: 'rename-key',
                  path: '$.paths',
                  from: path,
                  to: newPath,
                },
              ],
            },
          })
        );
      }
    }

    return findings;
  }
}

export const pluralResources = new PluralResourcesRule();
