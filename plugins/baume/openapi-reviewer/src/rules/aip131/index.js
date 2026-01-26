// @ts-check
/**
 * AIP-131: Standard Methods - Get
 *
 * @see https://google.aip.dev/131
 * @module rules/aip131
 */

export { getNoBody, GetNoBodyRule } from './get-no-body.js';

import { getNoBody } from './get-no-body.js';

export const rules = [getNoBody];
