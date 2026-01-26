# Baume Reviewer - Rules Documentation

This document covers all rules implemented in the reviewer and how to extend them.

## Overview

Baume ships with **17 built-in rules** based on [Google's API Improvement Proposals (AIP)](https://google.aip.dev). These represent industry best practices for REST API design.

The rule engine is designed to be **extensible** — you can disable built-in rules, adjust their severity, or add custom rules using a declarative YAML format.

## Built-in Rules (AIP-Based)

All built-in rules use the `aip{number}/` prefix, mapping directly to the corresponding AIP document at `https://google.aip.dev/{number}`.

| Rule ID                          | Severity   | Category         | Description                             |
| -------------------------------- | ---------- | ---------------- | --------------------------------------- |
| `aip122/plural-resources`        | warning    | naming           | Resource names should be plural         |
| `aip122/no-verbs`                | error      | naming           | No verbs in paths, use HTTP methods     |
| `aip122/consistent-casing`       | warning    | naming           | Consistent casing across all paths      |
| `aip122/nested-ownership`        | suggestion | naming           | Nested params should reflect parent     |
| `aip131/get-no-body`             | error      | standard-methods | GET must not have request body          |
| `aip133/post-returns-created`    | suggestion | standard-methods | POST should return 201/202              |
| `aip134/patch-over-put`          | suggestion | standard-methods | Prefer PATCH for partial updates        |
| `aip135/delete-idempotent`       | warning    | standard-methods | DELETE should be idempotent, no body    |
| `aip158/list-paginated`          | warning    | pagination       | List endpoints need pagination          |
| `aip158/max-page-size`           | suggestion | pagination       | Page size needs maximum limit           |
| `aip158/response-has-next-token` | warning    | pagination       | Response must include next_page_token   |
| `aip193/schema-defined`          | warning    | errors           | Consistent error schema required        |
| `aip193/responses-documented`    | suggestion | errors           | Document error responses                |
| `aip193/standard-codes`          | suggestion | errors           | Use standard HTTP error codes           |
| `aip155/idempotency-key`         | suggestion | idempotency      | POST should accept Idempotency-Key      |
| `aip132/has-filtering`           | suggestion | filtering        | List endpoints should support filtering |
| `aip132/has-ordering`            | suggestion | filtering        | List endpoints should support ordering  |

---

## Rule Categories

### Naming (AIP-122)

Resource naming conventions from [AIP-122: Resource Names](https://google.aip.dev/122).

#### `aip122/plural-resources`

Resource names in paths should be plural nouns (e.g., `/users` not `/user`).

**Exceptions:** `health`, `status`, `config`, `settings`, `metadata`, `info`, `auth`, `data`, `media`, `analytics`, `news`, `series`

```yaml
# Bad
/user/{id}
/order/{orderId}/item/{itemId}

# Good
/users/{id}
/orders/{orderId}/items/{itemId}
```

#### `aip122/no-verbs`

Paths should use nouns, not verbs. HTTP methods convey the action.

```yaml
# Bad
/getUsers
/createOrder

# Good
GET /users
POST /orders
```

**Note:** Custom method suffixes with `:` are allowed (e.g., `/orders/{id}:cancel`).

#### `aip122/consistent-casing`

All path segments should use consistent casing style throughout the API.

```yaml
# Bad (mixed styles)
/user_accounts    # snake_case
/orderItems       # camelCase

# Good (consistent)
/user_accounts
/order_items
```

#### `aip122/nested-ownership`

Nested resource parameters should reflect parent ownership.

```yaml
# Bad
/users/{userId}/orders/{id}

# Good
/users/{userId}/orders/{orderId}
```

---

### Standard Methods (AIP-131 to AIP-135)

HTTP method conventions from the AIP standard methods specifications.

#### `aip131/get-no-body`

GET requests must not have a request body. Use query parameters instead.

```yaml
# Bad
get:
  requestBody:
    content:
      application/json:
        schema: { ... }

# Good
get:
  parameters:
    - name: filter
      in: query
```

#### `aip133/post-returns-created`

POST for resource creation should return `201 Created` or `202 Accepted`, not `200 OK`.

```yaml
# Suggested
post:
  responses:
    '201':
      description: Resource created
    '202':
      description: Request accepted, processing async
```

#### `aip134/patch-over-put`

Prefer PATCH for partial updates over PUT.

```yaml
# Good - both available
/users/{id}:
  put:
    description: Replace user entirely
  patch:
    description: Update specific fields
```

#### `aip135/delete-idempotent`

DELETE should be idempotent: no request body, return `200 OK`, `204 No Content`, or `202 Accepted`.

```yaml
# Good
delete:
  responses:
    '204':
      description: Resource deleted
    '404':
      description: Resource not found
```

---

### Pagination (AIP-158)

Pagination conventions from [AIP-158: Pagination](https://google.aip.dev/158).

#### `aip158/list-paginated`

List (collection) endpoints should support pagination via `page_size`/`limit` and `page_token`/`cursor`/`offset`.

```yaml
# Good
get:
  parameters:
    - name: page_size
      in: query
      schema:
        type: integer
        maximum: 100
    - name: page_token
      in: query
      schema:
        type: string
```

#### `aip158/max-page-size`

Page size parameter should have a maximum value.

```yaml
# Good
- name: page_size
  in: query
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20
```

#### `aip158/response-has-next-token`

Paginated list responses must include `next_page_token` for fetching the next page.

```yaml
# Good
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            items:
              type: array
            next_page_token:
              type: string
              nullable: true
```

---

### Errors (AIP-193)

Error handling conventions from [AIP-193: Errors](https://google.aip.dev/193).

#### `aip193/schema-defined`

API should define a consistent error response schema in `components/schemas`.

```yaml
# Good
components:
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
```

#### `aip193/responses-documented`

Operations should document error responses (4xx/5xx) or use a `default` response.

```yaml
# Good
responses:
  '200':
    description: Success
  '400':
    description: Bad request
  '404':
    description: Not found
  default:
    description: Unexpected error
```

#### `aip193/standard-codes`

Use standard HTTP error codes. Non-standard codes (e.g., 418, 499) should be avoided.

**Standard client errors:** 400, 401, 403, 404, 405, 409, 412, 422, 429
**Standard server errors:** 500, 501, 502, 503, 504

---

### Idempotency (AIP-155)

Request identification from [AIP-155: Request Identification](https://google.aip.dev/155).

#### `aip155/idempotency-key`

POST endpoints should accept an `Idempotency-Key` header for safe retries.

```yaml
# Good
post:
  parameters:
    - name: Idempotency-Key
      in: header
      required: false
      schema:
        type: string
      description: Unique key for idempotent requests
```

**Exceptions:** Search/query endpoints (paths containing `search`).

---

### Filtering (AIP-132, AIP-160)

Filtering and ordering from [AIP-132: Standard List](https://google.aip.dev/132) and [AIP-160: Filtering](https://google.aip.dev/160).

#### `aip132/has-filtering`

List endpoints should support filtering via `filter` parameter or field-specific parameters.

```yaml
# Option 1: Generic filter
parameters:
  - name: filter
    in: query
    schema:
      type: string
    description: 'Filter expression (e.g., status="active")'

# Option 2: Field-specific filters
parameters:
  - name: status
    in: query
  - name: created_after
    in: query
```

#### `aip132/has-ordering`

List endpoints should support ordering via `order_by`, `sort`, or similar parameter.

```yaml
# Good
parameters:
  - name: order_by
    in: query
    schema:
      type: string
    description: 'Sort order (e.g., "created_at desc, name asc")'
```

---

## Customizing Rules

### Configuration File

Create `.api-hygiene/config.yaml` in your project to customize rule behavior:

```yaml
# Extend a built-in preset
extends: google-aip-standard

# Disable specific rules
rules:
  aip155/idempotency-key:
    enabled: false
    reason: 'Using database-level deduplication'

  # Adjust severity
  aip158/list-paginated:
    severity: error # Promote from warning to error

  # Adjust weight (for scoring)
  aip193/schema-defined:
    weight: 10 # Default was 7

# Exclude paths from all rules
exclude:
  - /health
  - /metrics
  - /internal/*
```

### Built-in Presets

| Preset                | Description                                   |
| --------------------- | --------------------------------------------- |
| `google-aip-strict`   | Full AIP compliance, all rules enabled        |
| `google-aip-standard` | Balanced — errors and warnings, no nitpicking |
| `google-aip-minimal`  | Critical rules only — for legacy APIs         |
| `rest-best-practices` | AIP-inspired with generic naming              |

---

## Custom Rules (Declarative Engine)

Beyond adjusting built-in rules, you can define entirely new rules using a safe, declarative YAML format.

### Rule Location

Place custom rules in `.api-hygiene/rules/`:

```
my-project/
├── openapi.yaml
└── .api-hygiene/
    ├── config.yaml
    └── rules/
        ├── require-auth.yaml
        └── no-pii-in-query.yaml
```

Reference them in your config:

```yaml
# .api-hygiene/config.yaml
extends: google-aip-standard

customRules:
  - ./rules/require-auth.yaml
  - ./rules/no-pii-in-query.yaml
```

### Declarative Rule Format

Rules are pure data — no executable code. The engine interprets them safely.

```yaml
# .api-hygiene/rules/require-auth.yaml
id: myorg/require-auth
name: Require Authentication
description: All endpoints except health checks must have security defined
severity: error
weight: 10

# What this rule applies to
scope: operation # operation | path | spec | schema

# Filter: which operations to check
match:
  pathExcludes: ['/health', '/metrics', '/docs/**']

# The actual check — using built-in functions
check:
  hasSecurity: true

# Message when check fails
message: 'Endpoint {method} {path} has no security defined'
suggestion: 'Add security requirement or document why auth is not needed'
```

### Built-in Check Functions

These functions are available in the `check` block:

**Operation-level:**

- `hasRequestBody: boolean` — Does the operation have a request body?
- `hasParameter: {names: [], in: query|header|path}` — Does it have specific parameters?
- `hasSecurity: boolean` — Does the operation have security requirements?
- `hasResponse: [200, 201, 400]` — Does it document these status codes?

**Path-level:**

- `pathMatches: "/users/*"` — Glob pattern matching
- `pathExcludes: ["/health", "/internal/*"]` — Exclusion patterns
- `isCollectionEndpoint: boolean` — Is this a list endpoint (GET without trailing {id})?

**Spec-level:**

- `schemaExists: {namePattern: "*Error*"}` — Does this schema exist?

**Logical operators:**

- `and: [check1, check2]` — All checks must pass
- `or: [check1, check2]` — Any check can pass
- `not: check` — Invert the result

### CEL Expressions for Complex Logic

For rules that can't be expressed with built-in functions, use [CEL expressions](https://github.com/google/cel-spec):

```yaml
id: myorg/no-pii-in-query
name: No PII in Query Parameters
severity: error

match:
  methods: [GET]

check:
  cel: |
    !(operation.parameters ?? [])
      .filter(p, p.in == "query")
      .exists(p, p.name.matches("(?i)(email|phone|ssn|password)"))

message: 'Query parameter may contain PII - use POST with body instead'
```

CEL runs in a sandboxed environment with:

- No filesystem, network, or process access
- 50ms execution time limit
- 1MB memory limit

### Example: Complete Custom Rule

```yaml
# .api-hygiene/rules/versioned-paths.yaml
id: myorg/versioned-paths
name: API Version in Path
description: All paths should include version prefix
severity: warning
weight: 5
scope: path

match:
  pathExcludes: ['/health', '/metrics']

check:
  pathMatches: '/v[0-9]*/**'

message: "Path '{path}' missing version prefix"
suggestion: 'Add version prefix like /v1{path}'

# Optional: auto-fix specification
fix:
  type: rename-path
  changes:
    - operation: rename-key
      path: '$.paths'
      from: '{path}'
      to: '/v1{path}'
```

---

## CLI Usage

```bash
# Run all rules
baume-review api.yaml

# Only specific categories
baume-review api.yaml -c naming -c pagination

# Skip specific rules
baume-review api.yaml -x aip122/plural-resources -x aip155/idempotency-key

# JSON output for CI
baume-review api.yaml --format json

# SARIF output for IDE integration
baume-review api.yaml --format sarif

# Strict mode (warnings become errors)
baume-review api.yaml --strict

# Lenient mode (skip strict OpenAPI validation)
baume-review api.yaml --lenient
```

---

## Why AIP-Based Rules?

Google's API Improvement Proposals represent years of API design experience at scale. They address common problems:

- **AIP-122 (Naming):** Consistent resource naming reduces cognitive load
- **AIP-131-135 (Methods):** Proper HTTP method usage improves cacheability and idempotency
- **AIP-158 (Pagination):** Prevents OOM on large datasets, enables efficient iteration
- **AIP-193 (Errors):** Consistent error formats simplify client error handling
- **AIP-155 (Idempotency):** Safe retries prevent duplicate operations

The `aip{number}/` prefix in rule IDs makes it easy to look up the original rationale at `https://google.aip.dev/{number}`.

---

## Extending Beyond AIP

While AIP rules provide a solid foundation, Baume is designed for **any API standard**:

- **Company standards:** Create rules for internal conventions
- **Industry requirements:** HIPAA, PCI-DSS, SOC2 compliance checks
- **Framework patterns:** NestJS, Fastify, Express-specific conventions
- **Custom validations:** PII detection, auth requirements, versioning policies

The declarative rule engine ensures custom rules are safe to execute — no arbitrary code, just data.
