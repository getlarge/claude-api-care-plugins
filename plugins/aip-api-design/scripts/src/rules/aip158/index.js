// @ts-check
/**
 * AIP-158: Pagination
 *
 * @see https://google.aip.dev/158
 * @module rules/aip158
 */

export { listPaginated, ListPaginatedRule } from './list-paginated.js';
export { maxPageSize, MaxPageSizeRule } from './max-page-size.js';
export { responseNextToken, ResponseNextTokenRule } from './response-next-token.js';

import { listPaginated } from './list-paginated.js';
import { maxPageSize } from './max-page-size.js';
import { responseNextToken } from './response-next-token.js';

export const rules = [listPaginated, maxPageSize, responseNextToken];
