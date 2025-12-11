// @ts-check
/**
 * AIP-193: Standard Error Codes
 *
 * Use standard HTTP error status codes.
 *
 * @see https://google.aip.dev/193
 * @module rules/aip193/standard-codes
 */

import { OperationRule } from '../base.js';

// Standard error codes per AIP-193
const STANDARD_CLIENT_ERRORS = new Set([
  '400', // Bad Request
  '401', // Unauthorized
  '403', // Forbidden
  '404', // Not Found
  '405', // Method Not Allowed
  '409', // Conflict
  '412', // Precondition Failed
  '422', // Unprocessable Entity
  '429', // Too Many Requests
]);

const STANDARD_SERVER_ERRORS = new Set([
  '500', // Internal Server Error
  '501', // Not Implemented
  '502', // Bad Gateway
  '503', // Service Unavailable
  '504', // Gateway Timeout
]);

const ALL_STANDARD = new Set([
  ...STANDARD_CLIENT_ERRORS,
  ...STANDARD_SERVER_ERRORS,
]);

/**
 * Rule: Use standard HTTP error codes
 */
export class StandardErrorCodesRule extends OperationRule {
  constructor() {
    super({
      id: 'aip193/standard-codes',
      name: 'Standard Error Codes',
      aip: 'AIP-193',
      severity: 'suggestion',
      description: 'Use standard HTTP error status codes',
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

    for (const code of Object.keys(responses)) {
      // Skip success codes and default
      if (code === 'default' || code.startsWith('2') || code.startsWith('3'))
        continue;

      if (!ALL_STANDARD.has(code)) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: `Non-standard error code ${code}`,
            suggestion: `Use standard codes: 400, 401, 403, 404, 409, 422, 429 (client) or 500, 503 (server)`,
            context: { code, standardCodes: [...ALL_STANDARD] },
          })
        );
      }
    }

    return findings;
  }
}

export const standardCodes = new StandardErrorCodesRule();
