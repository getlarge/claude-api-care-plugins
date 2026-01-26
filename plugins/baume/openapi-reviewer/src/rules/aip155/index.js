// @ts-check
/**
 * AIP-155: Request Identification
 *
 * @see https://google.aip.dev/155
 * @module rules/aip155
 */

export { idempotencyKey, IdempotencyKeyRule } from './idempotency-key.js';

import { idempotencyKey } from './idempotency-key.js';

export const rules = [idempotencyKey];
