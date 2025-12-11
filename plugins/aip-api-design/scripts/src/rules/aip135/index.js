// @ts-check
/**
 * AIP-135: Standard Methods - Delete
 *
 * @see https://google.aip.dev/135
 * @module rules/aip135
 */

export { deleteIdempotent, DeleteIdempotentRule } from './delete-idempotent.js';

import { deleteIdempotent } from './delete-idempotent.js';

export const rules = [deleteIdempotent];
