// @ts-check
/**
 * OpenAPI spec traversal and resolution utilities
 * @module rules/helpers/spec-utils
 */

/**
 * @typedef {import('../../types.ts').OpenAPISpec} OpenAPISpec
 * @typedef {import('../../types.ts').Operation} Operation
 * @typedef {import('../../types.ts').Schema} Schema
 * @typedef {import('../../types.ts').Response} Response
 * @typedef {import('../../types.ts').Parameter} Parameter
 */

/**
 * HTTP methods in OpenAPI specs
 * @type {string[]}
 */
const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
];

/**
 * Get all operations from a spec
 * @param {OpenAPISpec} spec - The OpenAPI specification
 * @returns {Array<{path: string, method: string, operation: Operation}>}
 */
export function getAllOperations(spec) {
  const operations = [];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      // @ts-ignore - dynamic property access
      const operation = pathItem[method];
      if (operation) {
        operations.push({ path, method: method.toUpperCase(), operation });
      }
    }
  }

  return operations;
}

/**
 * Check if operation has a parameter
 * @param {Operation} operation - The operation object
 * @param {string} paramName - Parameter name to find
 * @param {'query' | 'header' | 'path' | 'cookie'} [location='query'] - Parameter location
 * @returns {boolean}
 */
export function hasParameter(operation, paramName, location = 'query') {
  return (operation.parameters || []).some(
    (p) => p.name === paramName && p.in === location
  );
}

/**
 * Resolve a local $ref pointer
 * @template {Schema | Response | Parameter} [T=Schema]
 * @param {OpenAPISpec} spec - The OpenAPI spec
 * @param {string} ref - The $ref string (e.g., "#/components/schemas/User")
 * @returns {T | undefined}
 */
export function resolveRef(spec, ref) {
  if (!ref || !ref.startsWith('#/')) return undefined;

  const segments = ref.slice(2).split('/');
  /** @type {unknown} */
  let current = spec;

  for (const segment of segments) {
    if (current !== null && typeof current === 'object') {
      current = /** @type {Record<string, unknown>} */ (current)[segment];
    } else {
      return undefined;
    }
  }

  return /** @type {T | undefined} */ (current);
}

/**
 * Get response schema for an operation, resolving $ref if needed
 * @param {OpenAPISpec} spec - The OpenAPI spec
 * @param {Operation} operation - The operation object
 * @param {string} statusCode - Status code to get schema for
 * @returns {Schema | undefined}
 */
export function getResponseSchema(spec, operation, statusCode) {
  const response = operation.responses?.[statusCode];
  if (!response) return undefined;

  // Handle $ref at response level
  /** @type {Response | undefined} */
  const resolvedResponse = response.$ref
    ? resolveRef(spec, response.$ref)
    : response;
  if (!resolvedResponse) return undefined;

  // Get content (typically application/json)
  const content = resolvedResponse.content;
  if (!content) return undefined;

  const mediaType =
    content['application/json'] || content['*/*'] || Object.values(content)[0];
  if (!mediaType?.schema) return undefined;

  // Resolve schema $ref if present
  const schema = mediaType.schema;
  return schema.$ref ? resolveRef(spec, schema.$ref) : schema;
}
