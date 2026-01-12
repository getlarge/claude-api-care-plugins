---
description: Apply AIP rule fixes to OpenAPI specs. Supports automated fixing via CLI or manual phase-by-phase implementation from a plan.
argument-hint: [plan-path] [--phase N] [--task N.N]
---

# API Fix

Apply fixes to OpenAPI specs. Two modes available:

1. **Automated** — Run CLI fixer directly on a spec
2. **Plan-based** — Implement fixes phase-by-phase from a review plan

## Automated Fixing (Recommended for Spec-Only Changes)

**Option A: MCP Tool (Recommended)**

If the `mcp__aip-reviewer__aip-apply-fixes` tool is available, use it:

```
Use mcp__aip-reviewer__aip-apply-fixes with:
- reviewId: {review-id-from-aip-review}
- specPath: {absolute-path-to-spec} (for local files)
- OR specUrl: {http-url-to-spec} (for remote specs)
- writeBack: true (to save changes to specPath)
- dryRun: false (set true to preview changes)
```

The MCP tool will:

- Apply suggested fixes from the review findings
- Return a signed download URL for the modified spec (valid for 5 minutes)
- Optionally write back to the original file if writeBack=true and specPath is used
- Show summary of applied/failed fixes

**Option B: CLI Fixer (Fallback)**

Use the CLI fixer for quick, automated spec corrections:

```bash
# Preview fixes (dry run)
npx aip-review openapi.yaml --fix --dry-run

# Apply fixes to a new file
npx aip-review openapi.yaml --fix --output openapi-fixed.yaml

# Apply fixes in-place (overwrite original)
npx aip-review openapi.yaml --fix --output openapi.yaml
```

### CLI Options

| Flag                   | Description                                 |
| ---------------------- | ------------------------------------------- |
| `-F, --fix`            | Enable fix mode                             |
| `-o, --output <path>`  | Output path (default: `<spec>.fixed.<ext>`) |
| `--dry-run`            | Show what would be fixed without writing    |
| `-c, --category <cat>` | Only fix specific categories                |
| `-x, --skip <rule>`    | Skip specific rules                         |

### Programmatic Usage

```javascript
import { OpenAPIReviewer } from '@anthropic/aip-review';
import { OpenAPIFixer } from '@anthropic/aip-review/fixer';

// Review the spec
const reviewer = new OpenAPIReviewer();
const result = reviewer.review(spec, 'openapi.yaml');

// Apply all fixes
const fixer = new OpenAPIFixer(spec);
const fixResults = fixer.applyFixes(result.findings);

// Get the fixed spec
const fixedSpec = fixer.getSpec();
const summary = fixer.getSummary();
// { total: 5, applied: 4, failed: 1, changes: 12 }
```

### What Gets Fixed Automatically

- Path segment renames (`/user/{id}` → `/users/{id}`)
- Parameter additions (pagination, filtering, idempotency)
- Response status code corrections
- Schema additions and constraints
- Request body removals (e.g., GET with body)

### What Requires Manual Work

- Framework-specific code changes (controllers, routes)
- Business logic adjustments
- Breaking change migrations
- Custom validation rules

---

## Plan-Based Fixing (For Complex Changes)

When fixes require code changes beyond the spec, use the plan-based workflow:

```
/api-fix {plan-path}
/api-fix {plan-path} --phase 1
/api-fix {plan-path} --task 1.2
/api-fix  (uses most recent plan)
```

### Instructions

1. **Load the plan document**:
   - Parse YAML frontmatter for status and framework
   - Identify which phases/tasks are pending
   - If `--phase` specified, focus on that phase
   - If `--task` specified, focus on that specific task

2. **Before making changes**:
   - Confirm with user which phase/task to implement
   - Show what files will be affected
   - Ask if they want to proceed

3. **For each task**, based on framework:

### OpenAPI Spec Changes

Always update the spec file directly:

- Path renames
- Parameter additions
- Schema modifications
- Error response definitions

### NestJS Implementation

```typescript
// Pagination DTO
export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsString()
  page_token?: string;
}

// Error filter
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  // ... standard error formatting
}
```

### Fastify Implementation

```typescript
// Pagination schema
const paginationSchema = {
  querystring: {
    type: 'object',
    properties: {
      page_size: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      page_token: { type: 'string' },
    },
  },
};

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  // ... standard error formatting
});
```

4. **After implementing each task**:
   - Run relevant tests if available
   - Update the plan document: mark task as `[x]` complete
   - Update phase status if all tasks done

5. **Update plan frontmatter**:

   ```yaml
   phases:
     - name: Quick Wins
       status: complete # was: pending
       completed_at: { timestamp }
   ```

6. **Do NOT**:
   - Implement multiple phases without user confirmation
   - Skip the spec update (spec is source of truth)
   - Forget to mark tasks complete in plan

## Output Behavior

After each task:

```
✓ Task 1.1 complete: Fixed resource naming
  - Renamed /user/{id} → /users/{id}
  - Updated openapi.yaml
  - Updated src/routes/user.ts

Updated plan: thoughts/api/plans/2024-01-15-orders-api-plan.md

Continue with Task 1.2? [y/n]
```

After each phase:

```
✓ Phase 1 complete: Quick Wins

Summary:
- 3 tasks completed
- 5 files modified
- 0 tests broken

Run /api-validate to verify fixes, or continue with Phase 2?
```

## Error Handling

If a fix fails or breaks tests:

1. Stop and report the issue
2. Do NOT mark task as complete
3. Suggest manual intervention or alternative approach
4. Offer to rollback changes

## Breaking Changes

For tasks marked as breaking changes:

1. Warn user before implementing
2. Suggest migration strategy
3. Consider creating both old and new paths temporarily

---

## Understanding Fix Data (For Manual Fixes)

Each finding includes machine-readable fix instructions. The CLI fixer processes these automatically, but you can also apply them manually when needed.

### Fix Structure

```typescript
interface Fix {
  type: FixType; // What kind of fix
  jsonPath: string; // Where in the spec
  target?: object; // Additional context
  replacement?: unknown; // New value
  specChanges: SpecChange[]; // Atomic operations
}

interface SpecChange {
  operation: 'rename-key' | 'set' | 'add' | 'remove' | 'merge';
  path: string; // JSONPath to target
  from?: string; // For rename-key
  to?: string; // For rename-key
  value?: unknown; // For set/add/merge
}
```

### How the Fixer Applies Changes

The `OpenAPIFixer` processes `specChanges` array sequentially:

| Operation    | Description                           | Example                      |
| ------------ | ------------------------------------- | ---------------------------- |
| `rename-key` | Rename a key in an object             | `/user/{id}` → `/users/{id}` |
| `set`        | Set a value at path (creates parents) | Add response schema          |
| `add`        | Append to array (creates if missing)  | Add parameter                |
| `remove`     | Delete at path                        | Remove requestBody           |
| `merge`      | Merge into object/array               | Add multiple parameters      |

### Fix Type Reference

| Fix Type                | Description            | Spec Change                       |
| ----------------------- | ---------------------- | --------------------------------- |
| `rename-path-segment`   | Rename a path segment  | Rename key in `$.paths`           |
| `rename-parameter`      | Rename a parameter     | Update parameter name             |
| `add-parameter`         | Add query/header param | Add to operation parameters array |
| `add-parameters`        | Add multiple params    | Merge into parameters array       |
| `remove-request-body`   | Remove requestBody     | Delete `requestBody` key          |
| `change-status-code`    | Change response code   | Rename key in responses           |
| `add-operation`         | Add HTTP method        | Add method to path item           |
| `add-schema`            | Add component schema   | Set in `$.components.schemas`     |
| `add-schema-property`   | Add schema property    | Set in schema properties          |
| `add-response`          | Add response           | Set in operation responses        |
| `set-schema-constraint` | Set max/min/pattern    | Set constraint on schema          |

### Example: Applying a rename-path-segment fix

Given this fix block in the review:

```yaml
type: rename-path-segment
jsonPath: "$.paths['/user/{id}']"
target:
  segment: user
  segmentIndex: 0
replacement: users
specChanges:
  - operation: rename-key
    path: '$.paths'
    from: '/user/{id}'
    to: '/users/{id}'
```

**Steps to apply:**

1. Open the OpenAPI spec file
2. Find the path `/user/{id}` at `$.paths['/user/{id}']`
3. Rename the key to `/users/{id}`
4. Search codebase for references to the old path and update them
5. Update any route decorators/handlers (e.g., `@Get('/user/:id')` → `@Get('/users/:id')`)

### Example: Applying an add-parameter fix

Given this fix block:

```yaml
type: add-parameter
jsonPath: "$.paths['/users'].post.parameters"
replacement:
  name: Idempotency-Key
  in: header
  required: false
  schema:
    type: string
  description: Unique key for idempotent requests
specChanges:
  - operation: add
    path: "$.paths['/users'].post.parameters"
    value: { name: Idempotency-Key, in: header, ... }
```

**Steps to apply:**

1. Open the OpenAPI spec file
2. Navigate to `$.paths['/users'].post`
3. Add or create the `parameters` array
4. Insert the parameter object from `replacement`
5. Implement the header handling in your framework:
   - NestJS: Add `@Headers('idempotency-key')` parameter
   - Fastify: Add to route schema and access via `request.headers`

### Example: Applying an add-schema fix

Given this fix block:

```yaml
type: add-schema
jsonPath: '$.components.schemas'
target:
  schemaName: Error
replacement:
  type: object
  required: [error]
  properties:
    error:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
        details: { type: array }
specChanges:
  - operation: set
    path: "$.components.schemas['Error']"
    value: { ... }
```

**Steps to apply:**

1. Open the OpenAPI spec file
2. Navigate to or create `components.schemas`
3. Add the `Error` schema from `replacement`
4. Update error responses in operations to reference `$ref: '#/components/schemas/Error'`
5. Implement the error response structure in your framework's exception handler

---

## Examples

### Quick Fix (CLI)

```bash
# Review and fix in one command
$ npx aip-review api.yaml --fix --dry-run

Found 3 fixable issue(s)

  ✓ aip122/plural-resources
  ✓ aip131/get-no-body
  ✓ aip158/list-pagination

Dry run: Would apply 3 fix(es) (5 change(s))
2 issue(s) require manual fixes:
  - POST /orders: Missing error schema definition
  - GET /orders: Should support filtering

$ npx aip-review api.yaml --fix -o api.yaml
Applied 3 fix(es) (5 change(s))
Fixed spec written to: api.yaml
```

### Plan-Based Fix (Interactive)

User: `/api-fix thoughts/api/plans/2024-01-15-orders-api-plan.md`

Claude: "Phase 1 (Quick Wins) has 3 tasks pending.

**Automated fixes available:** Tasks 1.1 and 1.2 can be applied automatically.
Run `npx aip-review openapi.yaml --fix` first, then I'll handle Task 1.3 which needs code changes.

Or start with Task 1.1: Fix resource naming?"

User: `/api-fix --phase 2`

Claude: "Skipping to Phase 2 (Pagination). This has 2 tasks:

- 2.1: Add pagination parameters (auto-fixable)
- 2.2: Update controller to use page tokens (needs code)

Ready to implement?"

### Combining Both Approaches

For best results:

1. Run automated fixer first: `npx aip-review api.yaml --fix -o api.yaml`
2. Re-run review to see remaining issues: `npx aip-review api.yaml`
3. Use `/api-fix` for manual code changes that remain
