// @ts-check
/**
 * AIP-158: Pagination Has Maximum
 *
 * Page size parameter should have a maximum value.
 *
 * @see https://google.aip.dev/158
 * @module rules/aip158/max-page-size
 */

import { ParameterRule } from '../base.js';
import { parametersToJsonPath } from '../helpers/index.js';

/**
 * Rule: Page size should have a maximum
 */
export class MaxPageSizeRule extends ParameterRule {
  constructor() {
    super({
      id: 'aip158/max-page-size',
      name: 'Pagination Has Maximum',
      aip: 'AIP-158',
      severity: 'suggestion',
      description: 'Page size parameter should have a maximum value',
    });

    // Only check query parameters
    /** @type {readonly string[]} */
    this.locations = ['query'];
  }

  /**
   * @param {import('../../types.ts').Parameter} param
   * @param {string} method
   * @param {string} path
   * @param {import('../../types.ts').OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkParameter(param, method, path, spec, ctx) {
    /** @type {import('../../types.ts').Finding[]} */
    const findings = [];

    // Only check page size parameters
    const pageSizeNames = ['page_size', 'pageSize', 'limit'];
    if (!pageSizeNames.includes(param.name)) return findings;

    // Only check GET methods
    if (method !== 'GET') return findings;

    if (param.schema && param.schema.maximum === undefined) {
      // Find the index of this parameter in the operation
      const paramJsonPath = `${parametersToJsonPath(path, method)}[?(@.name=='${param.name}')].schema`;
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: `Parameter '${param.name}' has no maximum value`,
          suggestion: 'Add maximum: 100 (or appropriate limit) to schema',
          fix: {
            type: 'set-schema-constraint',
            jsonPath: paramJsonPath,
            target: { paramName: param.name, constraint: 'maximum' },
            replacement: 100,
            specChanges: [
              {
                operation: 'set',
                path: `${paramJsonPath}.maximum`,
                value: 100,
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const maxPageSize = new MaxPageSizeRule();
