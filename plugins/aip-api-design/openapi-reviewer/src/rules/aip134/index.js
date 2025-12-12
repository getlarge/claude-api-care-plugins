// @ts-check
/**
 * AIP-134: Standard Methods - Update
 *
 * @see https://google.aip.dev/134
 * @module rules/aip134
 */

export { patchOverPut, PatchOverPutRule } from './patch-over-put.js';

import { patchOverPut } from './patch-over-put.js';

export const rules = [patchOverPut];
