// @ts-check
/**
 * AIP-193: Error Responses Documented
 *
 * Operations should document error responses.
 *
 * @see https://google.aip.dev/193
 * @module rules/aip193/responses-documented
 */

import { OperationRule } from '../base.js';

/**
 * Rule: Error responses should be documented
 */
export class ErrorResponsesDocumentedRule extends OperationRule {
  constructor() {
    super({
      id: 'aip193/responses-documented',
      name: 'Error Responses Documented',
      aip: 'AIP-193',
      severity: 'suggestion',
      description: 'Operations should document error responses',
    });
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

    const responses = operation.responses || {};
    const errorCodes = Object.keys(responses).filter(
      (code) =>
        code !== 'default' && (code.startsWith('4') || code.startsWith('5'))
    );

    if (errorCodes.length === 0 && !responses.default) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'No error responses documented',
          suggestion: 'Add 4xx/5xx responses or a default error response',
        })
      );
    }

    return findings;
  }
}

export const responsesDocumented = new ErrorResponsesDocumentedRule();
