// @ts-check
/**
 * AIP-132: List Has Ordering
 *
 * List endpoints should support ordering/sorting.
 *
 * @see https://google.aip.dev/132
 * @module rules/aip132/has-ordering
 */

import { OperationRule } from '../base.js';
import {
  isCollectionEndpoint,
  parametersToJsonPath,
} from '../helpers/index.js';

/**
 * Rule: List endpoints should have ordering
 */
export class HasOrderingRule extends OperationRule {
  constructor() {
    super({
      id: 'aip132/has-ordering',
      name: 'List Endpoints Support Ordering',
      aip: 'AIP-132',
      severity: 'suggestion',
      description: 'List endpoints should support ordering/sorting',
      category: 'filtering', // Override: this is a filtering rule
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

    const params = operation.parameters || [];
    const hasOrderParam = params.some(
      (p) =>
        p.in === 'query' &&
        ['order_by', 'orderBy', 'sort', 'sort_by', 'sortBy', 'order'].includes(
          p.name
        )
    );

    if (!hasOrderParam) {
      const suggestedParam = {
        name: 'order_by',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Sort order (e.g., "created_at desc")',
      };
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'List endpoint missing ordering parameter',
          suggestion:
            'Add order_by query parameter (e.g., "created_at desc, name asc")',
          context: { suggestedParam },
          fix: {
            type: 'add-parameter',
            jsonPath: parametersToJsonPath(path, method),
            replacement: suggestedParam,
            specChanges: [
              {
                operation: 'add',
                path: parametersToJsonPath(path, method),
                value: suggestedParam,
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const hasOrdering = new HasOrderingRule();
