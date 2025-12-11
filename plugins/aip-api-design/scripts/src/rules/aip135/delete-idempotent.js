// @ts-check
/**
 * AIP-135: DELETE Is Idempotent
 *
 * DELETE should be idempotent and not have a request body.
 *
 * @see https://google.aip.dev/135
 * @module rules/aip135/delete-idempotent
 */

import { OperationRule } from '../base.js';

/**
 * Rule: DELETE should be idempotent
 */
export class DeleteIdempotentRule extends OperationRule {
  constructor() {
    super({
      id: 'aip135/delete-idempotent',
      name: 'DELETE Is Idempotent',
      aip: 'AIP-135',
      severity: 'warning',
      description: 'DELETE should be idempotent and not have a request body',
    });

    // Only run on DELETE methods
    this.methods = ['DELETE'];
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

    // Check for request body
    if (operation.requestBody) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'DELETE should not have a request body',
          suggestion: 'Move any required data to path or query parameters',
        })
      );
    }

    const responses = operation.responses || {};

    // Check for non-idempotent response codes
    if ('201' in responses) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message:
            'DELETE returns 201 Created, which implies non-idempotent behavior',
          suggestion: 'Use 200 OK, 204 No Content, or 202 Accepted instead',
        })
      );
    }

    // Should typically return 200, 204, or 404
    const responseCodes = Object.keys(responses);
    // Exclude 201 since it's already flagged above
    const successCodes = responseCodes.filter(
      (c) => c.startsWith('2') && c !== '201'
    );

    if (
      successCodes.length > 0 &&
      !successCodes.some((c) => ['200', '202', '204'].includes(c))
    ) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: `DELETE uses unusual success code(s): ${successCodes.join(
            ', '
          )}`,
          suggestion: 'Use 200 OK (with body), 204 No Content, or 202 Accepted',
        })
      );
    }

    return findings;
  }
}

export const deleteIdempotent = new DeleteIdempotentRule();
