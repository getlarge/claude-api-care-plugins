// @ts-check
/**
 * AIP-122: Nested Resource Ownership
 *
 * Nested resource parameters should reflect parent ownership.
 *
 * @see https://google.aip.dev/122
 * @module rules/aip122/nested-ownership
 */

import { PathRule } from '../base.js';

/**
 * Rule: Nested resource parameters should reflect parent ownership
 */
export class NestedOwnershipRule extends PathRule {
  constructor() {
    super({
      id: 'aip122/nested-ownership',
      name: 'Nested Resource Ownership',
      aip: 'AIP-122',
      severity: 'suggestion',
      description: 'Nested resource parameters should reflect parent ownership',
    });
  }

  /**
   * @param {string} path
   * @param {import('../../types.ts').PathItem} pathItem
   * @param {import('../../types.ts').OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkPath(path, pathItem, spec, ctx) {
    const findings = [];
    const segments = path.split('/').filter(Boolean);

    // Find parameter segments and their preceding resource
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.startsWith('{')) continue;

      const paramName = segment.slice(1, -1); // Remove { }
      const parentResource = segments[i - 1];

      // Skip if parent is also a parameter
      if (parentResource.startsWith('{')) continue;

      // Check if generic 'id' is used in nested context
      if (paramName === 'id' && i > 1) {
        // Get singular form of parent for suggestion
        const singularParent = parentResource.endsWith('s')
          ? parentResource.slice(0, -1)
          : parentResource;

        findings.push(
          ctx.createFinding({
            path,
            message: `Generic '{id}' in nested path. Use descriptive name like '{${singularParent}Id}'`,
            suggestion: `Rename to {${singularParent}Id} to clarify ownership`,
            context: {
              paramName,
              parentResource,
              suggestedName: `${singularParent}Id`,
            },
          })
        );
      }
    }

    return findings;
  }
}

export const nestedOwnership = new NestedOwnershipRule();
