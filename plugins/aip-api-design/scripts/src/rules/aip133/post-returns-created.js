// @ts-check
/**
 * AIP-133: POST Returns 201 or 202
 *
 * POST for resource creation should return 201 Created or 202 Accepted.
 *
 * @see https://google.aip.dev/133
 * @module rules/aip133/post-returns-created
 */

import { OperationRule } from '../base.js';

/**
 * Rule: POST should return 201 Created or 202 Accepted
 */
export class PostReturnsCreatedRule extends OperationRule {
  constructor() {
    super({
      id: 'aip133/post-returns-201',
      name: 'POST Returns 201 or 202',
      aip: 'AIP-133',
      severity: 'suggestion',
      description:
        'POST for resource creation should return 201 Created or 202 Accepted',
    });

    // Only run on POST methods
    this.methods = ['POST'];
  }

  /**
   * @param {string} method
   * @param {import('../../types.ts').Operation} operation
   * @param {string} path
   * @param {import('../../types.ts').OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkOperation(method, operation, path, spec, ctx) {
    const findings = [];

    // Skip custom methods
    if (path.includes(':')) return findings;

    const responses = operation.responses || {};
    const has201or202 = '201' in responses || '202' in responses;
    const has200 = '200' in responses;

    if (!has201or202 && has200) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message:
            'POST returns 200. Consider 201 (Created) for sync or 202 (Accepted) for async.',
          suggestion:
            'Use 201 when resource is created immediately, 202 for async creation',
        })
      );
    }

    return findings;
  }
}

export const postReturnsCreated = new PostReturnsCreatedRule();
