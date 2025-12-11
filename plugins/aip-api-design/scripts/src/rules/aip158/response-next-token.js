// @ts-check
/**
 * AIP-158: Response Has Next Token
 *
 * Paginated list responses should include next_page_token.
 *
 * @see https://google.aip.dev/158
 * @module rules/aip158/response-next-token
 */

import { OperationRule } from '../base.js';
import {
  isCollectionEndpoint,
  hasParameter,
  getResponseSchema,
} from '../helpers/index.js';

/**
 * Rule: Paginated responses should have next_page_token
 */
export class ResponseNextTokenRule extends OperationRule {
  constructor() {
    super({
      id: 'aip158/response-next-token',
      name: 'Response Has Next Page Token',
      aip: 'AIP-158',
      severity: 'warning',
      description: 'Paginated list responses should include next_page_token',
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

    // Only check collection endpoints
    if (!isCollectionEndpoint(path)) return findings;

    // Check if this endpoint has pagination request params
    const hasPaginationParams =
      hasParameter(operation, 'page_size') ||
      hasParameter(operation, 'pageSize') ||
      hasParameter(operation, 'limit') ||
      hasParameter(operation, 'page_token') ||
      hasParameter(operation, 'pageToken') ||
      hasParameter(operation, 'cursor');

    // Only check endpoints that have pagination params
    if (!hasPaginationParams) return findings;

    // Get success response schema
    const schema = getResponseSchema(spec, operation, '200');
    if (!schema) return findings;

    // Check for next_page_token in response
    const props = schema.properties || {};
    const hasNextToken =
      'next_page_token' in props ||
      'nextPageToken' in props ||
      'next_cursor' in props ||
      'nextCursor' in props ||
      'cursor' in props;

    if (!hasNextToken) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'Paginated response missing next_page_token field',
          suggestion:
            'Add next_page_token (string, nullable) to response schema',
          context: {
            suggestedField: {
              next_page_token: { type: 'string', nullable: true },
            },
          },
        })
      );
    }

    return findings;
  }
}

export const responseNextToken = new ResponseNextTokenRule();
