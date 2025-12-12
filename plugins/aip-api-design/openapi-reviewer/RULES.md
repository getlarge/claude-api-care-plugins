# AIP OpenAPI Reviewer - Supported Rules

This document lists all 17 rules implemented in the reviewer, organized by category.

## Quick Reference

| Rule ID                              | Severity   | AIP     | Description                             |
| ------------------------------------ | ---------- | ------- | --------------------------------------- |
| `naming/plural-resources`            | warning    | AIP-122 | Resource names should be plural         |
| `naming/no-verbs`                    | error      | AIP-131 | No verbs in paths, use HTTP methods     |
| `naming/consistent-casing`           | warning    | AIP-122 | Consistent casing across all paths      |
| `naming/nested-ownership`            | suggestion | AIP-122 | Nested params should reflect parent     |
| `methods/get-no-body`                | error      | AIP-131 | GET must not have request body          |
| `methods/post-returns-201`           | suggestion | AIP-131 | POST should return 201/202              |
| `methods/patch-over-put`             | suggestion | AIP-134 | Prefer PATCH for partial updates        |
| `methods/delete-idempotent`          | warning    | AIP-135 | DELETE should be idempotent, no body    |
| `pagination/list-paginated`          | warning    | AIP-158 | List endpoints need pagination          |
| `pagination/max-page-size`           | suggestion | AIP-158 | Page size needs maximum limit           |
| `pagination/response-has-next-token` | warning    | AIP-158 | Response must include next_page_token   |
| `errors/schema-defined`              | warning    | AIP-193 | Consistent error schema required        |
| `errors/responses-documented`        | suggestion | AIP-193 | Document error responses                |
| `errors/standard-codes`              | suggestion | AIP-193 | Use standard HTTP error codes           |
| `idempotency/post-has-key`           | suggestion | AIP-155 | POST should accept Idempotency-Key      |
| `filtering/list-filterable`          | suggestion | AIP-160 | List endpoints should support filtering |
| `filtering/list-has-ordering`        | suggestion | AIP-132 | List endpoints should support ordering  |

---

## Naming Rules

### `naming/plural-resources`

**Severity:** warning
**AIP:** [AIP-122](https://google.aip.dev/122)

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

### `naming/no-verbs`

**Severity:** error
**AIP:** [AIP-131](https://google.aip.dev/131)

Paths should use nouns, not verbs. HTTP methods convey the action.

```yaml
# Bad
/getUsers
/createOrder
/deleteItem

# Good
GET /users
POST /orders
DELETE /items/{id}
```

**Note:** Custom method suffixes with `:` are allowed (e.g., `/orders/{id}:cancel`).

### `naming/consistent-casing`

**Severity:** warning
**AIP:** [AIP-122](https://google.aip.dev/122)

All path segments should use consistent casing style throughout the API.

```yaml
# Bad (mixed styles)
/user_accounts    # snake_case
/orderItems       # camelCase

# Good (consistent snake_case)
/user_accounts
/order_items
```

### `naming/nested-ownership`

**Severity:** suggestion
**AIP:** [AIP-122](https://google.aip.dev/122)

Nested resource parameters should reflect parent ownership, not use generic `{id}`.

```yaml
# Bad
/users/{userId}/orders/{id}

# Good
/users/{userId}/orders/{orderId}
```

---

## Standard Methods Rules

### `methods/get-no-body`

**Severity:** error
**AIP:** [AIP-131](https://google.aip.dev/131)

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

### `methods/post-returns-201`

**Severity:** suggestion
**AIP:** [AIP-131](https://google.aip.dev/131)

POST for resource creation should return `201 Created` (sync) or `202 Accepted` (async), not `200 OK`.

```yaml
# Suggested
post:
  responses:
    '201':
      description: Resource created
    '202':
      description: Request accepted, processing async
```

### `methods/patch-over-put`

**Severity:** suggestion
**AIP:** [AIP-134](https://google.aip.dev/134)

Prefer PATCH for partial updates over PUT. If you have PUT, consider also adding PATCH.

```yaml
# Good - both available
/users/{id}:
  put:
    description: Replace user entirely
  patch:
    description: Update specific fields
```

### `methods/delete-idempotent`

**Severity:** warning
**AIP:** [AIP-135](https://google.aip.dev/135)

DELETE should be idempotent:

- No request body
- Return `200 OK`, `204 No Content`, or `202 Accepted`
- Never return `201 Created`

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

## Pagination Rules

### `pagination/list-paginated`

**Severity:** warning
**AIP:** [AIP-158](https://google.aip.dev/158)

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

### `pagination/max-page-size`

**Severity:** suggestion
**AIP:** [AIP-158](https://google.aip.dev/158)

Page size parameter should have a maximum value to prevent abuse.

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

### `pagination/response-has-next-token`

**Severity:** warning
**AIP:** [AIP-158](https://google.aip.dev/158)

Paginated list responses must include `next_page_token` (or equivalent) for fetching next page.

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

## Error Rules

### `errors/schema-defined`

**Severity:** warning
**AIP:** [AIP-193](https://google.aip.dev/193)

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

### `errors/responses-documented`

**Severity:** suggestion
**AIP:** [AIP-193](https://google.aip.dev/193)

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

### `errors/standard-codes`

**Severity:** suggestion
**AIP:** [AIP-193](https://google.aip.dev/193)

Use standard HTTP error codes. Non-standard codes (e.g., 418, 499) should be avoided.

**Standard client errors:** 400, 401, 403, 404, 405, 409, 412, 422, 429
**Standard server errors:** 500, 501, 502, 503, 504

---

## Idempotency Rules

### `idempotency/post-has-key`

**Severity:** suggestion
**AIP:** [AIP-155](https://google.aip.dev/155)

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

## Filtering Rules

### `filtering/list-filterable`

**Severity:** suggestion
**AIP:** [AIP-160](https://google.aip.dev/160)

List endpoints should document available filters via `filter` parameter or field-specific parameters.

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

### `filtering/list-has-ordering`

**Severity:** suggestion
**AIP:** [AIP-132](https://google.aip.dev/132)

List endpoints should support ordering/sorting via `order_by`, `sort`, or similar parameter.

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

## CLI Usage

```bash
# Run all rules
aip-review api.yaml

# Only specific categories
aip-review api.yaml -c naming -c pagination

# Skip specific rules
aip-review api.yaml -x naming/plural-resources -x idempotency/post-has-key

# JSON output for CI
aip-review api.yaml --format json

# Strict mode (warnings become errors)
aip-review api.yaml --strict
```
