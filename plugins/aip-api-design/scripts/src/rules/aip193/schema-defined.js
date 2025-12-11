// @ts-check
/**
 * AIP-193: Error Schema Defined
 *
 * API should define a consistent error response schema.
 *
 * @see https://google.aip.dev/193
 * @module rules/aip193/schema-defined
 */

import { SpecRule } from '../base.js';

/**
 * Rule: Error schema should be defined
 */
export class ErrorSchemaDefinedRule extends SpecRule {
  constructor() {
    super({
      id: 'aip193/schema-defined',
      name: 'Error Schema Defined',
      aip: 'AIP-193',
      severity: 'warning',
      description: 'API should define a consistent error response schema',
    });
  }

  /**
   * @param {import('../../types.ts').OpenAPISpec} spec
   * @param {import('../../types.ts').RuleContext} ctx
   * @returns {import('../../types.ts').Finding[]}
   */
  checkSpec(spec, ctx) {
    const findings = [];
    const schemas = spec.components?.schemas || {};

    const errorSchemas = Object.keys(schemas).filter((name) =>
      name.toLowerCase().includes('error')
    );

    if (errorSchemas.length === 0) {
      findings.push(
        ctx.createFinding({
          path: 'components/schemas',
          message: 'No error schema defined',
          suggestion:
            'Define an Error schema with code, message, and details fields',
          context: {
            suggestedSchema: {
              type: 'object',
              required: ['error'],
              properties: {
                error: {
                  type: 'object',
                  required: ['code', 'message'],
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'array' },
                    request_id: { type: 'string' },
                  },
                },
              },
            },
          },
        })
      );
    }

    return findings;
  }
}

export const schemaDefined = new ErrorSchemaDefinedRule();
