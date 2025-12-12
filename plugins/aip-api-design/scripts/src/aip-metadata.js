// @ts-check
/**
 * AIP Metadata - Centralized information about implemented AIPs
 *
 * Shared between CLI and MCP server for consistent AIP information.
 *
 * @module aip-metadata
 */

/**
 * @typedef {Object} AIPInfo
 * @property {string} title - Short title of the AIP
 * @property {string} summary - Brief description of what the AIP covers
 * @property {string} [category] - Category grouping (naming, methods, pagination, etc.)
 */

/** @type {Record<number, AIPInfo>} */
export const AIP_METADATA = {
  122: {
    title: 'Resource Names',
    summary: 'URIs should use plural nouns, lowercase, hyphen-separated',
    category: 'naming',
  },
  131: {
    title: 'Standard Methods: Get',
    summary: 'GET requests should not have a request body',
    category: 'standard-methods',
  },
  132: {
    title: 'Standard Methods: List',
    summary: 'List operations should support filtering and ordering',
    category: 'standard-methods',
  },
  133: {
    title: 'Standard Methods: Create',
    summary: 'POST should return 201 Created with the created resource',
    category: 'standard-methods',
  },
  134: {
    title: 'Standard Methods: Update',
    summary: 'Use PATCH for partial updates, support field masks',
    category: 'standard-methods',
  },
  135: {
    title: 'Standard Methods: Delete',
    summary: 'DELETE should be idempotent',
    category: 'standard-methods',
  },
  155: {
    title: 'Request Identification',
    summary: 'Support Idempotency-Key header for POST requests',
    category: 'idempotency',
  },
  158: {
    title: 'Pagination',
    summary: 'List endpoints should use page_token and page_size parameters',
    category: 'pagination',
  },
  160: {
    title: 'Filtering',
    summary: 'List endpoints should support filter expressions',
    category: 'filtering',
  },
  193: {
    title: 'Errors',
    summary: 'Use consistent error schema with code, message, and details',
    category: 'errors',
  },
};

/**
 * Get AIP info by number
 * @param {number} aip - AIP number
 * @returns {AIPInfo | undefined}
 */
export function getAIPInfo(aip) {
  return AIP_METADATA[aip];
}

/**
 * Get all implemented AIP numbers
 * @returns {number[]}
 */
export function getImplementedAIPs() {
  return Object.keys(AIP_METADATA)
    .map(Number)
    .sort((a, b) => a - b);
}
