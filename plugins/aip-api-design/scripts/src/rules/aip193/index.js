// @ts-check
/**
 * AIP-193: Errors
 *
 * @see https://google.aip.dev/193
 * @module rules/aip193
 */

export { schemaDefined, ErrorSchemaDefinedRule } from './schema-defined.js';
export { responsesDocumented, ErrorResponsesDocumentedRule } from './responses-documented.js';
export { standardCodes, StandardErrorCodesRule } from './standard-codes.js';

import { schemaDefined } from './schema-defined.js';
import { responsesDocumented } from './responses-documented.js';
import { standardCodes } from './standard-codes.js';

export const rules = [schemaDefined, responsesDocumented, standardCodes];
