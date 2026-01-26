---
description: Create a prioritized fix plan from API review findings. Groups related issues, finds code locations, and suggests implementation order with both spec and code diffs.
argument-hint: [review-path]
---

# Baume Plan

Create a prioritized implementation plan from API review findings with code location mapping.

## Usage

```
/baume-plan {review-path}
/baume-plan  (uses most recent review from .baume/reviews/)
```

## Instructions

### Step 1: Load Inputs

1. **Load the review document**:
   - If `$ARGUMENTS` provided, load that review file
   - Otherwise, find most recent review in `.baume/reviews/`
   - Parse the YAML frontmatter and findings

2. **Check for existing correlation**:
   - Look for `.baume/correlations/{spec-name}.json`
   - If exists and recent (< 24 hours), use it
   - If not, proceed to Step 2 to create correlation

### Step 2: Correlate Findings to Code (if needed)

If no correlation file exists, choose a correlation method:

**Option A: MCP Correlate Tool (Recommended)**

If the `mcp__baume__baume-correlate` tool is available:

```
Use mcp__baume__baume-correlate with:
- reviewId: {review-id-from-review-document}
- projectRoot: {absolute-path-to-project-root}
- specPath: {absolute-path-to-spec} (optional)
- framework: "nestjs" | "fastify" | "express" (optional hint)
- correlationLevel: "moderate" (optional, can be "minimal", "moderate", or "thorough")
```

The tool will automatically:

- Detect framework from package.json
- Extract unique operations from findings
- Batch process code location for all endpoints
- Save correlation to `.baume/correlations/{date}-{spec-name}.json`

**Option B: Manual Correlation (Fallback)**

If MCP tools are not available, use the `baume-code-correlator` skill:

1. **Detect framework** from `package.json`:
   - `@nestjs/core` → NestJS
   - `fastify` → Fastify
   - `express` → Express

2. **Extract unique operations** from findings:
   - Parse "GET /users/{id}" → method: GET, path: /users/{id}
   - Dedupe by method+path

3. **For each operation**, spawn `baume-code-locator` agent:
   - Pass: method, path, operationId (from spec), framework
   - Collect: file:line, confidence, snippet

4. **Save correlation** to `.baume/correlations/{date}-{spec-name}.json`

### Step 3: Analyze and group findings

**Use the machine-readable fix data** from `<details>` blocks in the review:

- `fix.type` tells you what kind of change is needed
- `fix.jsonPath` tells you where in the spec to change
- Group findings with the same `fix.type` together

Group by fix type complexity:

- **Quick wins** (`rename-*`, `remove-request-body`, `change-status-code`): Simple spec changes
- **Medium effort** (`add-parameter`, `add-parameters`, `set-schema-constraint`): Spec + code changes
- **Significant work** (`add-schema`, `add-operation`, `add-response`): New structures needed

Group by related changes:

- All naming issues for same resource (same `jsonPath` prefix)
- All pagination issues together (`add-parameters` with page_size/page_token)
- All error handling together (`add-schema` for Error, `add-response` for default)

### Step 4: Prioritize by impact

- Errors before warnings before suggestions
- Breaking changes flagged clearly
- Dependencies between fixes noted

### Step 5: Create plan document

Write to `.baume/plans/{date}-{spec-name}-plan.md` with:

- Code locations from correlation
- Spec diffs from finding.fix
- Suggested code diffs for deterministic fixes

## Output Format

````markdown
---
date: { ISO timestamp }
review_path: { path to review doc }
correlation_path: { path to correlation JSON }
spec_path: { original spec path }
framework: { detected or specified }
status: draft
planned_by: Claude
phases:
  - name: Quick Wins
    status: pending
    tasks: { n }
  - name: Pagination
    status: pending
    tasks: { n }
  - name: Error Handling
    status: pending
    tasks: { n }
---

# API Fix Plan: {spec-title}

**Review:** `{review-path}`
**Correlation:** `{correlation-path}`
**Spec:** `{spec-path}`
**Framework:** {framework}
**Date:** {date}

## Overview

This plan addresses {n} findings from the API review:

- {n} errors (must fix)
- {n} warnings (should fix)
- {n} suggestions (nice to have)
- {n}/{total} findings correlated to code locations

---

## Phase 1: Quick Wins

Fast fixes that improve API quality immediately.

### Task 1.1: Fix resource naming

**Finding:** `aip122/plural-resources` at `GET /user/{id}`
**Code Location:** `src/users/users.controller.ts:42` (high confidence)

**OpenAPI Fix:**

```diff
paths:
-  '/user/{id}':
+  '/users/{id}':
     get:
       operationId: getUser
```
````

**Code Fix:**

```diff
// src/users/users.controller.ts
-@Controller('user')
+@Controller('users')
export class UsersController {
```

- [ ] Apply spec fix (or regenerate from code)
- [ ] Apply code fix
- [ ] Verify spec regenerates correctly

**Breaking change:** Yes — clients using old paths will break
**Migration:** Add redirect from old path, deprecation period

---

### Task 1.2: Remove verbs from paths

**Finding:** `aip122/no-verbs` at `POST /createOrder`
**Code Location:** `src/orders/orders.controller.ts:28` (high confidence)

**OpenAPI Fix:**

```diff
paths:
-  '/createOrder':
-    post:
+  '/orders':
+    post:
       operationId: createOrder
```

**Code Fix:**

```diff
// src/orders/orders.controller.ts
-@Post('createOrder')
+@Post()
async create(@Body() dto: CreateOrderDto) {
```

- [ ] Apply spec fix
- [ ] Apply code fix
- [ ] Update any client code calling old endpoint

---

## Phase 2: Add Pagination

### Task 2.1: Add pagination to list endpoints

**Finding:** `aip158/list-paginated` at `GET /orders`
**Code Location:** `src/orders/orders.controller.ts:15` (high confidence)

**OpenAPI Fix:**

```diff
paths:
  '/orders':
    get:
+     parameters:
+       - name: page_size
+         in: query
+         schema:
+           type: integer
+           maximum: 100
+           default: 20
+       - name: page_token
+         in: query
+         schema:
+           type: string
```

**Code Fix:**

```diff
// src/orders/orders.controller.ts
@Get()
-async findAll() {
+async findAll(
+  @Query('page_size', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
+  @Query('page_token') pageToken?: string,
+) {
-  return this.ordersService.findAll();
+  return this.ordersService.findAll({ pageSize, pageToken });
}
```

**Implementation notes:**

- Use cursor-based pagination (not offset)
- Default page_size: 20, max: 100
- Return next_page_token in response

- [ ] Apply spec fix
- [ ] Apply code fix
- [ ] Update service to support pagination
- [ ] Add pagination DTO if needed

---

## Phase 3: Error Handling

### Task 3.1: Define standard error schema

**Finding:** `aip193/schema-defined`
**Code Location:** N/A (new schema to create)

**OpenAPI Fix:**

```diff
components:
  schemas:
+   Error:
+     type: object
+     required: [code, message]
+     properties:
+       code:
+         type: string
+         enum: [INVALID_ARGUMENT, NOT_FOUND, PERMISSION_DENIED, ...]
+       message:
+         type: string
+       details:
+         type: array
+         items:
+           type: object
+       request_id:
+         type: string
```

**Code Fix:**

```typescript
// src/common/dto/error.dto.ts (create new file)
export class ErrorDto {
  code: string;
  message: string;
  details?: Record<string, unknown>[];
  request_id?: string;
}
```

- [ ] Create Error schema in spec
- [ ] Create ErrorDto in code
- [ ] Create exception filter to format errors

**AIP Reference:** [AIP-193](https://google.aip.dev/193)

---

## Phase 4: Nice-to-Have (Optional)

### Task 4.1: Add Idempotency-Key header

- [ ] Add to all POST endpoints
- [ ] Implement idempotency store

### Task 4.2: Document filters

- [ ] Add filter parameter to list endpoints
- [ ] Document filterable fields

---

## Execution Checklist

Before starting:

- [ ] Create feature branch
- [ ] Ensure tests pass

After each phase:

- [ ] Run `/baume-validate {plan-path}` to check progress
- [ ] Update phase status in this document
- [ ] Commit changes

After all phases:

- [ ] Full test suite passes
- [ ] OpenAPI spec regenerated/updated
- [ ] Run final `/baume-review` to confirm fixes
- [ ] Create PR

## Next Steps

1. Review this plan and adjust priorities
2. Run `/baume-fix {this-plan-path}` to start implementing Phase 1
3. Or manually implement and use `/baume-validate` to track progress

```

## After Planning

Ask the user:

- Does the prioritization look right?
- Any phases to skip or reorder?
- What framework are you using? (if not detected)
- Ready to start with `/baume-fix {plan-path}`?

---

## Using Fix Data for Planning

The review document includes machine-readable fix data in collapsible `<details>` blocks. Use this to:

### 1. Group Related Fixes

Fixes with the same `fix.type` can often be batched:

```

rename-path-segment fixes → "Phase 1: Fix Resource Names"
add-parameter fixes → "Phase 2: Add Missing Parameters"
add-schema fixes → "Phase 3: Define Schemas"

````

### 2. Identify Dependencies

Fixes targeting the same `jsonPath` prefix are related:

```yaml
# These should be in the same task:
jsonPath: "$.paths['/users'].get.parameters"  # add pagination
jsonPath: "$.paths['/users'].get.parameters"  # add filtering
````

### 3. Detect Conflicts

Multiple fixes to the same location need careful ordering:

```yaml
# Potential conflict - path rename affects other fixes:
fix.type: rename-path-segment
specChanges.from: '/user/{id}'
specChanges.to: '/users/{id}'

# This fix references the OLD path - apply rename first:
fix.jsonPath: "$.paths['/user/{id}'].get.parameters"
```

### 4. Estimate Effort by Fix Type

| Fix Type                | Typical Effort | Why                                 |
| ----------------------- | -------------- | ----------------------------------- |
| `rename-path-segment`   | Quick          | Spec change + find/replace in code  |
| `rename-parameter`      | Quick          | Spec change + parameter rename      |
| `remove-request-body`   | Quick          | Just delete from spec               |
| `change-status-code`    | Quick          | Spec change + maybe code adjustment |
| `add-parameter`         | Medium         | Spec + validation + handler changes |
| `add-parameters`        | Medium         | Multiple parameters to add          |
| `set-schema-constraint` | Quick          | Just add max/min to schema          |
| `add-schema-property`   | Medium         | Schema change + possibly code       |
| `add-schema`            | Medium-High    | New schema + types + validation     |
| `add-response`          | Medium         | Spec + error handler implementation |
| `add-operation`         | High           | Entirely new endpoint to implement  |

---

## Example

User: `/baume-plan .baume/reviews/2025-01-15-orders-api-review.md`
