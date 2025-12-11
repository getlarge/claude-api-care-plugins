// @ts-check
/**
 * AIP-132/160: List Has Filtering
 *
 * List endpoints should document available filters.
 *
 * @see https://google.aip.dev/132
 * @see https://google.aip.dev/160
 * @module rules/aip132/has-filtering
 */

import { OperationRule } from '../base.js';
import { isCollectionEndpoint } from '../helpers/index.js';

/**
 * Rule: List endpoints should have filtering
 */
export class HasFilteringRule extends OperationRule {
  constructor() {
    super({
      id: 'aip132/has-filtering',
      name: 'List Endpoints Document Filtering',
      aip: 'AIP-160',
      severity: 'suggestion',
      description:
        'List endpoints should document available filters or filter parameter',
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

    const params = operation.parameters || [];
    const hasFilterParam = params.some(
      (p) =>
        p.in === 'query' &&
        ['filter', 'q', 'query', 'search'].includes(p.name.toLowerCase())
    );

    // Check for field-specific filters (e.g., status, created_after)
    const hasFieldFilters = params.some(
      (p) =>
        p.in === 'query' &&
        !['page_size', 'page_token', 'limit', 'offset', 'order_by'].includes(
          p.name
        )
    );

    if (!hasFilterParam && !hasFieldFilters) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'List endpoint has no filter parameters',
          suggestion:
            'Add filter parameter or field-specific filters (e.g., status, created_after)',
        })
      );
    }

    return findings;
  }
}

export const hasFiltering = new HasFilteringRule();
