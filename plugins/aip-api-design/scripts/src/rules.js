// @ts-check
/**
 * AIP-based Rules for OpenAPI Review
 * @module rules
 */

/**
 * @typedef {import('./types.ts').Rule} Rule
 * @typedef {import('./types.ts').Finding} Finding
 * @typedef {import('./types.ts').OpenAPISpec} OpenAPISpec
 * @typedef {import('./types.ts').RuleContext} RuleContext
 * @typedef {import('./types.ts').PathItem} PathItem
 * @typedef {import('./types.ts').Operation} Operation
 * @typedef {import('./types.ts').Parameter} Parameter
 */

// ============================================
// Helper Functions
// ============================================

/**
 * Extract path segments that are not parameters
 * @param {string} path - The URL path
 * @returns {string[]} Resource segments
 */
function getResourceSegments(path) {
  return path
    .split('/')
    .filter((s) => s && !s.startsWith('{') && !s.includes(':'));
}

/**
 * Check if a word looks like a verb
 * @param {string} word - Word to check
 * @returns {boolean}
 */
function looksLikeVerb(word) {
  const verbPrefixes = [
    'get',
    'fetch',
    'retrieve',
    'list',
    'create',
    'add',
    'insert',
    'update',
    'modify',
    'edit',
    'delete',
    'remove',
    'destroy',
    'find',
    'search',
    'check',
    'validate',
    'process',
    'execute',
    'run',
    'do',
    'perform',
    'send',
    'submit',
  ];

  const lower = word.toLowerCase();
  return verbPrefixes.some(
    (v) => lower.startsWith(v) && lower.length > v.length
  );
}

/**
 * Check if a word is likely singular (simple heuristic)
 * @param {string} word - Word to check
 * @returns {boolean}
 */
function isSingular(word) {
  const exceptions = new Set([
    'status',
    'address',
    'metadata',
    'info',
    'health',
    'auth',
    'config',
    'settings',
    'data',
    'media',
    'analytics',
    'news',
    'series',
  ]);

  const lower = word.toLowerCase();
  if (exceptions.has(lower)) return false;

  // Very simple: doesn't end in 's'
  return !lower.endsWith('s');
}

/**
 * Get all operations from a spec
 * @param {OpenAPISpec} spec
 * @returns {Array<{path: string, method: string, operation: Operation}>}
 */
function getAllOperations(spec) {
  const operations = [];
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of methods) {
      // @ts-ignore
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
 * @param {Operation} operation
 * @param {string} paramName
 * @param {'query' | 'header' | 'path'} location
 * @returns {boolean}
 */
function hasParameter(operation, paramName, location = 'query') {
  return (operation.parameters || []).some(
    (p) => p.name === paramName && p.in === location
  );
}

/**
 * Check if path is a collection endpoint (no trailing parameter)
 * @param {string} path
 * @returns {boolean}
 */
function isCollectionEndpoint(path) {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return !!last && !last.startsWith('{') && !last.includes(':');
}

/**
 * Detect casing style of a word
 * @param {string} word - Word to analyze
 * @returns {'snake_case' | 'kebab-case' | 'camelCase' | 'PascalCase' | 'lowercase'}
 */
function detectCasingStyle(word) {
  if (word.includes('_')) return 'snake_case';
  if (word.includes('-')) return 'kebab-case';
  if (/^[a-z]/.test(word) && /[A-Z]/.test(word)) return 'camelCase';
  if (/^[A-Z]/.test(word)) return 'PascalCase';
  return 'lowercase';
}

/**
 * Resolve a local $ref pointer
 * @template {import('./types.ts').Schema | import('./types.ts').Response | import('./types.ts').Parameter} [T=import('./types.ts').Schema]
 * @param {OpenAPISpec} spec - The OpenAPI spec
 * @param {string} ref - The $ref string (e.g., "#/components/schemas/User")
 * @returns {T | undefined}
 */
function resolveRef(spec, ref) {
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
 * @returns {import('./types.ts').Schema | undefined}
 */
function getResponseSchema(spec, operation, statusCode) {
  const response = operation.responses?.[statusCode];
  if (!response) return undefined;

  // Handle $ref at response level
  /** @type {import('./types.ts').Response | undefined} */
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

// ============================================
// Naming Rules (AIP-122, AIP-123)
// ============================================

/** @type {Rule} */
const pluralResourceNames = {
  id: 'naming/plural-resources',
  name: 'Plural Resource Names',
  category: 'naming',
  severity: 'warning',
  aip: 'AIP-122',
  description: 'Resource names should be plural nouns',
  check(spec, ctx) {
    const findings = [];

    for (const path of Object.keys(spec.paths || {})) {
      for (const segment of getResourceSegments(path)) {
        if (isSingular(segment)) {
          findings.push(
            ctx.createFinding({
              path,
              message: `Resource name '${segment}' appears singular. Use plural form.`,
              suggestion: `Rename to '${segment}s' or appropriate plural`,
              context: { segment, suggestedFix: `${segment}s` },
            })
          );
        }
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const noVerbsInPath = {
  id: 'naming/no-verbs',
  name: 'No Verbs in Path',
  category: 'naming',
  severity: 'error',
  aip: 'AIP-131',
  description: 'Paths should use nouns, not verbs. Use HTTP methods instead.',
  check(spec, ctx) {
    const findings = [];

    for (const path of Object.keys(spec.paths || {})) {
      for (const segment of getResourceSegments(path)) {
        // Skip custom method suffixes (e.g., :cancel, :publish)
        if (segment.includes(':')) continue;

        if (looksLikeVerb(segment)) {
          findings.push(
            ctx.createFinding({
              path,
              message: `Path contains verb '${segment}'. Use nouns for resources.`,
              suggestion: `Extract the noun (e.g., '${
                segment
                  .replace(
                    /^(get|fetch|create|add|update|delete|remove|list|find|search)/i,
                    ''
                  )
                  .toLowerCase() || 'resource'
              }')`,
              context: { segment },
            })
          );
        }
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const consistentCasing = {
  id: 'naming/consistent-casing',
  name: 'Consistent Casing',
  category: 'naming',
  severity: 'warning',
  aip: 'AIP-122',
  description: 'All path segments should use consistent casing style',
  check(spec, ctx) {
    const findings = [];
    const casingCounts = new Map();

    // Collect all resource segments and their casing
    for (const path of Object.keys(spec.paths || {})) {
      for (const segment of getResourceSegments(path)) {
        const style = detectCasingStyle(segment);
        if (style !== 'lowercase') {
          casingCounts.set(style, (casingCounts.get(style) || 0) + 1);
        }
      }
    }

    // If we have multiple casing styles, flag inconsistency
    const styles = [...casingCounts.entries()].filter(([, count]) => count > 0);
    if (styles.length > 1) {
      // Find dominant style
      const dominant = styles.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

      // Flag paths that don't match dominant style
      for (const path of Object.keys(spec.paths || {})) {
        for (const segment of getResourceSegments(path)) {
          const style = detectCasingStyle(segment);
          if (style !== 'lowercase' && style !== dominant) {
            findings.push(
              ctx.createFinding({
                path,
                message: `Inconsistent casing: '${segment}' uses ${style}, but API predominantly uses ${dominant}`,
                suggestion: `Convert to ${dominant} for consistency`,
                context: {
                  segment,
                  currentStyle: style,
                  dominantStyle: dominant,
                },
              })
            );
          }
        }
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const nestedResourceOwnership = {
  id: 'naming/nested-ownership',
  name: 'Nested Resource Ownership',
  category: 'naming',
  severity: 'suggestion',
  aip: 'AIP-122',
  description: 'Nested resource parameters should reflect parent ownership',
  check(spec, ctx) {
    const findings = [];

    for (const path of Object.keys(spec.paths || {})) {
      const segments = path.split('/').filter(Boolean);

      // Find parameter segments and their preceding resource
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        if (!segment.startsWith('{')) continue;

        const paramName = segment.slice(1, -1); // Remove { }
        const parentResource = segments[i - 1];

        // Skip if parent is also a parameter
        if (parentResource.startsWith('{')) continue;

        // Check if generic 'id' is used in nested context
        if (paramName === 'id' && i > 1) {
          // Get singular form of parent for suggestion
          const singularParent = parentResource.endsWith('s')
            ? parentResource.slice(0, -1)
            : parentResource;

          findings.push(
            ctx.createFinding({
              path,
              message: `Generic '{id}' in nested path. Use descriptive name like '{${singularParent}Id}'`,
              suggestion: `Rename to {${singularParent}Id} to clarify ownership`,
              context: {
                paramName,
                parentResource,
                suggestedName: `${singularParent}Id`,
              },
            })
          );
        }
      }
    }

    return findings;
  },
};

// ============================================
// Standard Methods Rules (AIP-131 to AIP-135)
// ============================================

/** @type {Rule} */
const getNoRequestBody = {
  id: 'methods/get-no-body',
  name: 'GET No Request Body',
  category: 'standard-methods',
  severity: 'error',
  aip: 'AIP-131',
  description: 'GET requests must not have a request body',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method === 'GET' && operation.requestBody) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'GET requests should not have a request body',
            suggestion:
              'Move body parameters to query parameters, or use POST for complex queries',
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const postReturnsCreated = {
  id: 'methods/post-returns-201',
  name: 'POST Returns 201 or 202',
  category: 'standard-methods',
  severity: 'suggestion',
  aip: 'AIP-131',
  description:
    'POST for resource creation should return 201 Created or 202 Accepted',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'POST') continue;

      // Skip custom methods
      if (path.includes(':')) continue;

      const responses = operation.responses || {};
      const has201or202 = '201' in responses || '202' in responses;
      const has200 = '200' in responses;

      if (!has201or202 && has200) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message:
              'POST returns 200. Consider 201 (Created) for sync or 202 (Accepted) for async.',
            suggestion:
              'Use 201 when resource is created immediately, 202 for async creation',
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const patchOverPut = {
  id: 'methods/patch-over-put',
  name: 'PATCH for Partial Updates',
  category: 'standard-methods',
  severity: 'suggestion',
  aip: 'AIP-134',
  description: 'Prefer PATCH for partial updates over PUT',
  check(spec, ctx) {
    const findings = [];

    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      // Only check resource paths (with ID parameter)
      if (!path.includes('{')) continue;

      if (pathItem.put && !pathItem.patch) {
        findings.push(
          ctx.createFinding({
            path: `PUT ${path}`,
            message:
              'Using PUT without PATCH. Consider adding PATCH for partial updates.',
            suggestion:
              'Add PATCH endpoint with field mask support for partial updates',
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const deleteIdempotent = {
  id: 'methods/delete-idempotent',
  name: 'DELETE Is Idempotent',
  category: 'standard-methods',
  severity: 'warning',
  aip: 'AIP-135',
  description: 'DELETE should be idempotent and not have a request body',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'DELETE') continue;

      // Check for request body
      if (operation.requestBody) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'DELETE should not have a request body',
            suggestion: 'Move any required data to path or query parameters',
          })
        );
      }

      // Check for non-idempotent response codes
      const responses = operation.responses || {};
      if ('201' in responses) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message:
              'DELETE returns 201 Created, which implies non-idempotent behavior',
            suggestion: 'Use 200 OK, 204 No Content, or 202 Accepted instead',
          })
        );
      }

      // Should typically return 200, 204, or 404
      const responseCodes = Object.keys(responses);
      // Exclude 201 since it's already flagged above
      const successCodes = responseCodes.filter(
        (c) => c.startsWith('2') && c !== '201'
      );

      if (
        successCodes.length > 0 &&
        !successCodes.some((c) => ['200', '202', '204'].includes(c))
      ) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: `DELETE uses unusual success code(s): ${successCodes.join(
              ', '
            )}`,
            suggestion:
              'Use 200 OK (with body), 204 No Content, or 202 Accepted',
          })
        );
      }
    }

    return findings;
  },
};

// ============================================
// Pagination Rules (AIP-158)
// ============================================

/** @type {Rule} */
const listHasPagination = {
  id: 'pagination/list-paginated',
  name: 'List Endpoints Have Pagination',
  category: 'pagination',
  severity: 'warning',
  aip: 'AIP-158',
  description: 'List endpoints should support pagination',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'GET') continue;
      if (!isCollectionEndpoint(path)) continue;

      const hasPageSize =
        hasParameter(operation, 'page_size') ||
        hasParameter(operation, 'pageSize') ||
        hasParameter(operation, 'limit');

      const hasPageToken =
        hasParameter(operation, 'page_token') ||
        hasParameter(operation, 'pageToken') ||
        hasParameter(operation, 'cursor') ||
        hasParameter(operation, 'offset');

      if (!hasPageSize && !hasPageToken) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'List endpoint missing pagination parameters',
            suggestion: 'Add page_size and page_token query parameters',
            context: {
              suggestedParams: ['page_size', 'page_token'],
            },
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const paginationMaxSize = {
  id: 'pagination/max-page-size',
  name: 'Pagination Has Maximum',
  category: 'pagination',
  severity: 'suggestion',
  aip: 'AIP-158',
  description: 'Page size parameter should have a maximum value',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'GET') continue;

      const pageSizeParam = (operation.parameters || []).find(
        (p) =>
          p.in === 'query' &&
          ['page_size', 'pageSize', 'limit'].includes(p.name)
      );

      if (pageSizeParam && pageSizeParam.schema) {
        const schema = pageSizeParam.schema;
        if (schema.maximum === undefined) {
          findings.push(
            ctx.createFinding({
              path: `${method} ${path}`,
              message: `Parameter '${pageSizeParam.name}' has no maximum value`,
              suggestion: 'Add maximum: 100 (or appropriate limit) to schema',
            })
          );
        }
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const responseHasNextToken = {
  id: 'pagination/response-has-next-token',
  name: 'Response Has Next Page Token',
  category: 'pagination',
  severity: 'warning',
  aip: 'AIP-158',
  description: 'Paginated list responses should include next_page_token',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'GET') continue;
      if (!isCollectionEndpoint(path)) continue;

      // Check if this endpoint has pagination request params
      const hasPaginationParams =
        hasParameter(operation, 'page_size') ||
        hasParameter(operation, 'pageSize') ||
        hasParameter(operation, 'limit') ||
        hasParameter(operation, 'page_token') ||
        hasParameter(operation, 'pageToken') ||
        hasParameter(operation, 'cursor');

      if (!hasPaginationParams) continue;

      // Get success response schema
      const schema = getResponseSchema(spec, operation, '200');
      if (!schema) continue;

      // Check for next_page_token in response
      const props = schema.properties || {};
      const hasNextToken =
        'next_page_token' in props ||
        'nextPageToken' in props ||
        'next_cursor' in props ||
        'nextCursor' in props ||
        'cursor' in props;

      if (!hasNextToken) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'Paginated response missing next_page_token field',
            suggestion:
              'Add next_page_token (string, nullable) to response schema',
            context: {
              suggestedField: {
                next_page_token: { type: 'string', nullable: true },
              },
            },
          })
        );
      }
    }

    return findings;
  },
};

// ============================================
// Error Handling Rules (AIP-193)
// ============================================

/** @type {Rule} */
const errorSchemaExists = {
  id: 'errors/schema-defined',
  name: 'Error Schema Defined',
  category: 'errors',
  severity: 'warning',
  aip: 'AIP-193',
  description: 'API should define a consistent error response schema',
  check(spec, ctx) {
    const findings = [];
    const schemas = spec.components?.schemas || {};

    const errorSchemas = Object.keys(schemas).filter((name) =>
      name.toLowerCase().includes('error')
    );

    if (errorSchemas.length === 0) {
      findings.push(
        ctx.createFinding({
          path: 'components/schemas',
          message: 'No error schema defined',
          suggestion:
            'Define an Error schema with code, message, and details fields',
          context: {
            suggestedSchema: {
              type: 'object',
              required: ['error'],
              properties: {
                error: {
                  type: 'object',
                  required: ['code', 'message'],
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'array' },
                    request_id: { type: 'string' },
                  },
                },
              },
            },
          },
        })
      );
    }

    return findings;
  },
};

/** @type {Rule} */
const errorResponsesDocumented = {
  id: 'errors/responses-documented',
  name: 'Error Responses Documented',
  category: 'errors',
  severity: 'suggestion',
  aip: 'AIP-193',
  description: 'Operations should document error responses',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      const responses = operation.responses || {};
      const errorCodes = Object.keys(responses).filter(
        (code) =>
          code !== 'default' && (code.startsWith('4') || code.startsWith('5'))
      );

      if (errorCodes.length === 0 && !responses.default) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'No error responses documented',
            suggestion: 'Add 4xx/5xx responses or a default error response',
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const standardErrorCodes = {
  id: 'errors/standard-codes',
  name: 'Standard Error Codes',
  category: 'errors',
  severity: 'suggestion',
  aip: 'AIP-193',
  description: 'Use standard HTTP error status codes',
  check(spec, ctx) {
    const findings = [];

    // Standard error codes per AIP-193
    const standardClientErrors = new Set([
      '400', // Bad Request
      '401', // Unauthorized
      '403', // Forbidden
      '404', // Not Found
      '405', // Method Not Allowed
      '409', // Conflict
      '412', // Precondition Failed
      '422', // Unprocessable Entity
      '429', // Too Many Requests
    ]);

    const standardServerErrors = new Set([
      '500', // Internal Server Error
      '501', // Not Implemented
      '502', // Bad Gateway
      '503', // Service Unavailable
      '504', // Gateway Timeout
    ]);

    const allStandard = new Set([
      ...standardClientErrors,
      ...standardServerErrors,
    ]);

    for (const { path, method, operation } of getAllOperations(spec)) {
      const responses = operation.responses || {};

      for (const code of Object.keys(responses)) {
        // Skip success codes and default
        if (code === 'default' || code.startsWith('2') || code.startsWith('3'))
          continue;

        if (!allStandard.has(code)) {
          findings.push(
            ctx.createFinding({
              path: `${method} ${path}`,
              message: `Non-standard error code ${code}`,
              suggestion: `Use standard codes: 400, 401, 403, 404, 409, 422, 429 (client) or 500, 503 (server)`,
              context: { code, standardCodes: [...allStandard] },
            })
          );
        }
      }
    }

    return findings;
  },
};

// ============================================
// Idempotency Rules
// ============================================

/** @type {Rule} */
const postIdempotencyKey = {
  id: 'idempotency/post-has-key',
  name: 'POST Supports Idempotency Key',
  category: 'idempotency',
  severity: 'suggestion',
  aip: 'AIP-155',
  description:
    'POST endpoints should accept an Idempotency-Key header for safe retries',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'POST') continue;

      // Skip custom methods and search/query endpoints
      if (path.includes(':') || path.includes('search')) continue;

      const hasIdempotencyKey = (operation.parameters || []).some(
        (p) =>
          p.in === 'header' &&
          ['idempotency-key', 'idempotency_key', 'x-idempotency-key'].includes(
            p.name.toLowerCase()
          )
      );

      if (!hasIdempotencyKey) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'POST endpoint missing Idempotency-Key header',
            suggestion:
              'Add optional Idempotency-Key header parameter for safe retries',
            context: {
              suggestedParam: {
                name: 'Idempotency-Key',
                in: 'header',
                required: false,
                schema: { type: 'string' },
                description: 'Unique key for idempotent requests',
              },
            },
          })
        );
      }
    }

    return findings;
  },
};

// ============================================
// Filtering Rules (AIP-160)
// ============================================

/** @type {Rule} */
const listHasFiltering = {
  id: 'filtering/list-filterable',
  name: 'List Endpoints Document Filtering',
  category: 'filtering',
  severity: 'suggestion',
  aip: 'AIP-160',
  description:
    'List endpoints should document available filters or filter parameter',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'GET') continue;
      if (!isCollectionEndpoint(path)) continue;

      const params = operation.parameters || [];
      const hasFilterParam = params.some(
        (p) =>
          p.in === 'query' &&
          ['filter', 'q', 'query', 'search'].includes(p.name.toLowerCase())
      );

      // Check for field-specific filters (e.g., status, created_after)
      const hasFieldFilters = params.some(
        (p) =>
          p.in === 'query' &&
          !['page_size', 'page_token', 'limit', 'offset', 'order_by'].includes(
            p.name
          )
      );

      if (!hasFilterParam && !hasFieldFilters) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'List endpoint has no filter parameters',
            suggestion:
              'Add filter parameter or field-specific filters (e.g., status, created_after)',
          })
        );
      }
    }

    return findings;
  },
};

/** @type {Rule} */
const listHasOrdering = {
  id: 'filtering/list-has-ordering',
  name: 'List Endpoints Support Ordering',
  category: 'filtering',
  severity: 'suggestion',
  aip: 'AIP-132',
  description: 'List endpoints should support ordering/sorting',
  check(spec, ctx) {
    const findings = [];

    for (const { path, method, operation } of getAllOperations(spec)) {
      if (method !== 'GET') continue;
      if (!isCollectionEndpoint(path)) continue;

      const params = operation.parameters || [];
      const hasOrderParam = params.some(
        (p) =>
          p.in === 'query' &&
          [
            'order_by',
            'orderBy',
            'sort',
            'sort_by',
            'sortBy',
            'order',
          ].includes(p.name)
      );

      if (!hasOrderParam) {
        findings.push(
          ctx.createFinding({
            path: `${method} ${path}`,
            message: 'List endpoint missing ordering parameter',
            suggestion:
              'Add order_by query parameter (e.g., "created_at desc, name asc")',
            context: {
              suggestedParam: {
                name: 'order_by',
                in: 'query',
                schema: { type: 'string' },
                description: 'Sort order (e.g., "created_at desc")',
              },
            },
          })
        );
      }
    }

    return findings;
  },
};

// ============================================
// Export All Rules
// ============================================

/** @type {Rule[]} */
export const defaultRules = [
  // Naming
  pluralResourceNames,
  noVerbsInPath,
  consistentCasing,
  nestedResourceOwnership,
  // Standard Methods
  getNoRequestBody,
  postReturnsCreated,
  patchOverPut,
  deleteIdempotent,
  // Pagination
  listHasPagination,
  paginationMaxSize,
  responseHasNextToken,
  // Errors
  errorSchemaExists,
  errorResponsesDocumented,
  standardErrorCodes,
  // Idempotency
  postIdempotencyKey,
  // Filtering
  listHasFiltering,
  listHasOrdering,
];

/**
 * Get rules by category
 * @param {import('./types.js').RuleCategory[]} categories
 * @returns {Rule[]}
 */
export function getRulesByCategory(categories) {
  return defaultRules.filter((rule) => categories.includes(rule.category));
}

/**
 * Get a rule by ID
 * @param {string} id
 * @returns {Rule | undefined}
 */
export function getRuleById(id) {
  return defaultRules.find((rule) => rule.id === id);
}
