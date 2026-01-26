// @ts-check
/**
 * JSONPath utilities for OpenAPI specs.
 * These helpers generate JSONPath expressions for locating elements
 * in OpenAPI specifications.
 *
 * @module rules/helpers/jsonpath
 */

/**
 * Build JSONPath for a path item
 * @param {string} path - The API path (e.g., '/users/{id}')
 * @returns {string} JSONPath (e.g., "$.paths['/users/{id}']")
 */
export function pathToJsonPath(path) {
  return `$.paths['${path}']`;
}

/**
 * Build JSONPath for an operation
 * @param {string} path - The API path
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @returns {string} JSONPath
 */
export function operationToJsonPath(path, method) {
  return `$.paths['${path}'].${method.toLowerCase()}`;
}

/**
 * Build JSONPath for operation parameters array
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @returns {string}
 */
export function parametersToJsonPath(path, method) {
  return `$.paths['${path}'].${method.toLowerCase()}.parameters`;
}

/**
 * Build JSONPath for path-level parameters
 * @param {string} path - The API path
 * @returns {string}
 */
export function pathParametersToJsonPath(path) {
  return `$.paths['${path}'].parameters`;
}

/**
 * Build JSONPath for requestBody
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @returns {string}
 */
export function requestBodyToJsonPath(path, method) {
  return `$.paths['${path}'].${method.toLowerCase()}.requestBody`;
}

/**
 * Build JSONPath for a response
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @param {string} statusCode - HTTP status code (e.g., '200', '404')
 * @returns {string}
 */
export function responseToJsonPath(path, method, statusCode) {
  return `$.paths['${path}'].${method.toLowerCase()}.responses['${statusCode}']`;
}

/**
 * Build JSONPath for all responses of an operation
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @returns {string}
 */
export function responsesToJsonPath(path, method) {
  return `$.paths['${path}'].${method.toLowerCase()}.responses`;
}

/**
 * Build JSONPath for a schema in components
 * @param {string} schemaName - The schema name
 * @returns {string}
 */
export function schemaToJsonPath(schemaName) {
  return `$.components.schemas['${schemaName}']`;
}

/**
 * Build JSONPath for schemas container
 * @returns {string}
 */
export function schemasContainerJsonPath() {
  return '$.components.schemas';
}

/**
 * Build JSONPath for a property within a schema
 * @param {string} schemaName - The schema name
 * @param {string} propertyName - The property name
 * @returns {string}
 */
export function schemaPropertyToJsonPath(schemaName, propertyName) {
  return `$.components.schemas['${schemaName}'].properties['${propertyName}']`;
}

/**
 * Build JSONPath for the response schema
 * @param {string} path - The API path
 * @param {string} method - HTTP method
 * @param {string} statusCode - HTTP status code
 * @param {string} [mediaType='application/json'] - Media type
 * @returns {string}
 */
export function responseSchemaToJsonPath(
  path,
  method,
  statusCode,
  mediaType = 'application/json'
) {
  return `$.paths['${path}'].${method.toLowerCase()}.responses['${statusCode}'].content['${mediaType}'].schema`;
}

/**
 * Compute new path after renaming a segment
 * @param {string} originalPath - Original API path
 * @param {string} oldSegment - Segment to rename
 * @param {string} newSegment - New segment name
 * @returns {string} New path with renamed segment
 */
export function computeRenamedPath(originalPath, oldSegment, newSegment) {
  // Handle exact segment match (not partial)
  const segments = originalPath.split('/');
  return segments.map((s) => (s === oldSegment ? newSegment : s)).join('/');
}
