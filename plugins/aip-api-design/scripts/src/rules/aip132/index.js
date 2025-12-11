// @ts-check
/**
 * AIP-132: Standard Methods - List
 *
 * @see https://google.aip.dev/132
 * @module rules/aip132
 */

export { hasFiltering, HasFilteringRule } from './has-filtering.js';
export { hasOrdering, HasOrderingRule } from './has-ordering.js';

import { hasFiltering } from './has-filtering.js';
import { hasOrdering } from './has-ordering.js';

export const rules = [hasFiltering, hasOrdering];
