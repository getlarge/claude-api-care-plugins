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
import {
  schemasContainerJsonPath,
  schemaToJsonPath,
} from '../helpers/index.js';

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
      const suggestedSchema = {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', description: 'Error code' },
              message: {
                type: 'string',
                description: 'Human-readable error message',
              },
              details: {
                type: 'array',
                description: 'Additional error details',
              },
              request_id: {
                type: 'string',
                description: 'Request identifier for debugging',
              },
            },
          },
        },
      };
      findings.push(
        ctx.createFinding({
          path: 'components/schemas',
          message: 'No error schema defined',
          suggestion:
            'Define an Error schema with code, message, and details fields',
          context: { suggestedSchema },
          fix: {
            type: 'add-schema',
            jsonPath: schemasContainerJsonPath(),
            target: { schemaName: 'Error' },
            replacement: suggestedSchema,
            specChanges: [
              {
                operation: 'set',
                path: schemaToJsonPath('Error'),
                value: suggestedSchema,
              },
            ],
          },
        })
      );
    }

    return findings;
  }
}

export const schemaDefined = new ErrorSchemaDefinedRule();
