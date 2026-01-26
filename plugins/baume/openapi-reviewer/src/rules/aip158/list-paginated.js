// @ts-check
/**
 * AIP-158: List Has Pagination
 *
 * List endpoints should support pagination.
 *
 * @see https://google.aip.dev/158
 * @module rules/aip158/list-paginated
 */

import { OperationRule } from '../base.js';
import {
  isCollectionEndpoint,
  hasParameter,
  parametersToJsonPath,
} from '../helpers/index.js';

/**
 * Rule: List endpoints should have pagination
 */
export class ListPaginatedRule extends OperationRule {
  constructor() {
    super({
      id: 'aip158/list-paginated',
      name: 'List Endpoints Have Pagination',
      aip: 'AIP-158',
      severity: 'warning',
      description: 'List endpoints should support pagination',
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
    /** @type {import('../../types.ts').Finding[]} */
    const findings = [];

    // Only check collection endpoints
    if (!isCollectionEndpoint(path)) return findings;

    const hasPageSize =
      hasParameter(operation, 'page_size') ||
      hasParameter(operation, 'pageSize') ||
      hasParameter(operation, 'limit');

    const hasPageToken =
      hasParameter(operation, 'page_token') ||
      hasParameter(operation, 'pageToken') ||
      hasParameter(operation, 'cursor') ||
      hasParameter(operation, 'offset');

    if (!hasPageSize && !hasPageToken) {
      const suggestedParams = [
        {
          name: 'page_size',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100 },
          description: 'Maximum number of items to return per page',
        },
        {
          name: 'page_token',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Token for fetching the next page of results',
        },
      ];
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'List endpoint missing pagination parameters',
          suggestion: 'Add page_size and page_token query parameters',
          context: {
            suggestedParams: ['page_size', 'page_token'],
          },
          fix: {
            type: 'add-parameters',
            jsonPath: parametersToJsonPath(path, method),
            replacement: suggestedParams,
            specChanges: [
              {
                operation: 'merge',
                path: parametersToJsonPath(path, method),
                value: suggestedParams,
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const listPaginated = new ListPaginatedRule();
