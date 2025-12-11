// @ts-check
/**
 * AIP-155: Idempotency Key
 *
 * POST endpoints should accept an Idempotency-Key header for safe retries.
 *
 * @see https://google.aip.dev/155
 * @module rules/aip155/idempotency-key
 */

import { OperationRule } from '../base.js';

/**
 * Rule: POST should support Idempotency-Key header
 */
export class IdempotencyKeyRule extends OperationRule {
  constructor() {
    super({
      id: 'aip155/idempotency-key',
      name: 'POST Supports Idempotency Key',
      aip: 'AIP-155',
      severity: 'suggestion',
      description:
        'POST endpoints should accept an Idempotency-Key header for safe retries',
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

    // Skip custom methods and search/query endpoints
    if (path.includes(':') || path.includes('search')) return findings;

    const hasIdempotencyKey = (operation.parameters || []).some(
      (p) =>
        p.in === 'header' &&
        ['idempotency-key', 'idempotency_key', 'x-idempotency-key'].includes(
          p.name.toLowerCase()
        )
    );

    if (!hasIdempotencyKey) {
      findings.push(
        ctx.createFinding({
          path: `${method} ${path}`,
          message: 'POST endpoint missing Idempotency-Key header',
          suggestion:
            'Add optional Idempotency-Key header parameter for safe retries',
          context: {
            suggestedParam: {
              name: 'Idempotency-Key',
              in: 'header',
              required: false,
              schema: { type: 'string' },
              description: 'Unique key for idempotent requests',
            },
          },
        })
      );
    }

    return findings;
  }
}

export const idempotencyKey = new IdempotencyKeyRule();
