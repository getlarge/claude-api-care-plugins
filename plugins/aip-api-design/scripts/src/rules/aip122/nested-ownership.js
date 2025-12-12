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
import { pathToJsonPath, isVersionPrefix } from '../helpers/index.js';

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
    /** @type {import('../../types.ts').Finding[]} */
    const findings = [];
    const segments = path.split('/').filter(Boolean);

    // Filter out version prefixes (v1, api, etc.) to count actual resource nesting
    const resourceSegments = segments.filter((s) => !isVersionPrefix(s));

    // Count resource-parameter pairs to determine nesting depth
    // A truly nested path has multiple resource/{param} patterns
    // e.g., /users/{userId}/orders/{orderId} has 2 resource-param pairs
    let resourceParamPairs = 0;
    for (let i = 0; i < resourceSegments.length - 1; i++) {
      const current = resourceSegments[i];
      const next = resourceSegments[i + 1];
      if (!current.startsWith('{') && next && next.startsWith('{')) {
        resourceParamPairs++;
      }
    }

    // Only check for nested ownership if there are multiple resource-param pairs
    if (resourceParamPairs < 2) {
      return findings;
    }

    // Find parameter segments and their preceding resource
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.startsWith('{')) continue;

      const paramName = segment.slice(1, -1); // Remove { }
      const parentResource = segments[i - 1];

      // Skip if parent is also a parameter or a version prefix
      if (parentResource.startsWith('{') || isVersionPrefix(parentResource))
        continue;

      // Check if generic 'id' is used
      if (paramName === 'id') {
        // Get singular form of parent for suggestion
        const singularParent = parentResource.endsWith('s')
          ? parentResource.slice(0, -1)
          : parentResource;
        const suggestedName = `${singularParent}Id`;
        const newPath = path.replace(`{${paramName}}`, `{${suggestedName}}`);

        findings.push(
          ctx.createFinding({
            path,
            message: `Generic '{id}' in nested path. Use descriptive name like '{${suggestedName}}'`,
            suggestion: `Rename to {${suggestedName}} to clarify ownership`,
            context: {
              paramName,
              parentResource,
              suggestedName,
            },
            fix: {
              type: 'rename-parameter',
              jsonPath: pathToJsonPath(path),
              target: { paramName, parentResource, parameterIndex: i },
              replacement: suggestedName,
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

export const nestedOwnership = new NestedOwnershipRule();
