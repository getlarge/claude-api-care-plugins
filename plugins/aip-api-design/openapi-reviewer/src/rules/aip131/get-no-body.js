// @ts-check
/**
 * AIP-131: GET No Request Body
 *
 * GET requests must not have a request body.
 *
 * @see https://google.aip.dev/131
 * @module rules/aip131/get-no-body
 */

import { OperationRule } from '../base.js';
import {
  requestBodyToJsonPath,
  operationToJsonPath,
} from '../helpers/index.js';

/**
 * Rule: GET requests should not have a request body
 */
export class GetNoBodyRule extends OperationRule {
  constructor() {
    super({
      id: 'aip131/get-no-body',
      name: 'GET No Request Body',
      aip: 'AIP-131',
      severity: 'error',
      description: 'GET requests must not have a request body',
    });

    // Only run on GET methods
    this.methods = ['GET'];
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

    if (operation.requestBody) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'GET requests should not have a request body',
          suggestion:
            'Move body parameters to query parameters, or use POST for complex queries',
          fix: {
            type: 'remove-request-body',
            jsonPath: operationToJsonPath(path, method),
            specChanges: [
              {
                operation: 'remove',
                path: requestBodyToJsonPath(path, method),
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const getNoBody = new GetNoBodyRule();
