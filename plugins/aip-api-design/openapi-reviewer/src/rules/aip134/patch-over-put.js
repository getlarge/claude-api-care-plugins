// @ts-check
/**
 * AIP-134: PATCH Over PUT
 *
 * Prefer PATCH for partial updates over PUT.
 *
 * @see https://google.aip.dev/134
 * @module rules/aip134/patch-over-put
 */

import { PathRule } from '../base.js';
import { pathToJsonPath, operationToJsonPath } from '../helpers/index.js';

/**
 * Rule: Prefer PATCH for partial updates
 */
export class PatchOverPutRule extends PathRule {
  constructor() {
    super({
      id: 'aip134/patch-over-put',
      name: 'PATCH for Partial Updates',
      aip: 'AIP-134',
      severity: 'suggestion',
      description: 'Prefer PATCH for partial updates over PUT',
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

    // Only check resource paths (with ID parameter)
    if (!path.includes('{')) return findings;

    if (pathItem.put && !pathItem.patch) {
      // Create a PATCH operation template based on the PUT operation
      const patchOperation = {
        summary: 'Partially update resource',
        description: 'Update resource fields using field mask (AIP-134)',
        parameters: [
          {
            name: 'update_mask',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Field mask specifying which fields to update',
          },
        ],
        requestBody: pathItem.put.requestBody,
        responses: pathItem.put.responses,
      };
      findings.push(
        ctx.createFinding({
          path: `PUT ${path}`,
          message:
            'Using PUT without PATCH. Consider adding PATCH for partial updates.',
          suggestion:
            'Add PATCH endpoint with field mask support for partial updates',
          fix: {
            type: 'add-operation',
            jsonPath: pathToJsonPath(path),
            target: { method: 'patch', basedOn: 'put' },
            replacement: patchOperation,
            specChanges: [
              {
                operation: 'set',
                path: operationToJsonPath(path, 'patch'),
                value: patchOperation,
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const patchOverPut = new PatchOverPutRule();
