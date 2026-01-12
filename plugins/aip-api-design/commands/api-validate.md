---
description: Validate fixes by re-running review and comparing against the plan. Updates plan status and shows remaining issues.
argument-hint: [plan-path]
---

# API Validate

Re-run API review and validate against the fix plan.

## Usage

```
/api-validate {plan-path}
/api-validate  (uses most recent plan)
```

## Instructions

1. **Load the plan document**:
   - Get original spec path from frontmatter
   - Get original review path
   - Parse current phase/task status

2. **Re-run the review**:

   **Option A: MCP Tool (Recommended)**

   If the `mcp__aip-reviewer__aip-review` tool is available:

   ```
   Use mcp__aip-reviewer__aip-review with:
   - specPath: {spec-path-from-plan}
   - Same categories/rules as original review
   ```

   **Option B: Node.js CLI (Fallback)**

   Run same AIP checks as `/api-review`:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" {spec-path} --format json
   ```

   - Generate new findings list
   - Don't create a new review document (just in-memory)

3. **Compare findings**:
   - Which original findings are now fixed?
   - Which findings still remain?
   - Any NEW findings introduced?

4. **Update the plan document**:
   - Mark tasks as verified complete if their findings are gone
   - Flag tasks that aren't actually fixed
   - Note any regressions

5. **Create validation summary**

## Output Format

```markdown
## Validation Report: {spec-title}

**Plan:** `{plan-path}`
**Validated:** {timestamp}

### Progress Summary

| Phase               | Tasks | Complete | Verified |
| ------------------- | ----- | -------- | -------- |
| Phase 1: Quick Wins | 3     | 3        | 3 ✓      |
| Phase 2: Pagination | 2     | 1        | 1 ✓      |
| Phase 3: Errors     | 3     | 0        | —        |

**Overall:** 4/8 tasks verified (50%)

### Fixed Issues ✓

- ✓ `naming/plural-resources` at `GET /user/{id}` — FIXED
- ✓ `naming/no-verbs` at `POST /createOrder` — FIXED
- ✓ `pagination/list-paginated` at `GET /orders` — FIXED

### Remaining Issues

- 🟡 `pagination/list-paginated` at `GET /users` — still missing
- 🟡 `errors/schema-defined` — not yet addressed
- 🟡 `errors/responses-documented` at 5 endpoints — not yet addressed

### Regressions ⚠️

{If any new issues introduced:}

- ⚠️ NEW: `naming/plural-resources` at `GET /item/{id}` — introduced in recent changes

### Recommendations

1. Continue with Phase 2: remaining pagination task
2. Start Phase 3: error handling
3. {Or} Ready for PR if current state is acceptable
```

## Plan Document Updates

Update the plan frontmatter:

```yaml
---
status: in_progress # or: complete
last_validated: { timestamp }
validation_summary:
  fixed: 4
  remaining: 4
  regressions: 0
phases:
  - name: Quick Wins
    status: verified # upgraded from complete
    verified_at: { timestamp }
  - name: Pagination
    status: partial
    tasks_verified: 1
    tasks_remaining: 1
---
```

## After Validation

Tell user:

- How many issues fixed vs remaining
- Whether any regressions
- Recommended next steps:
  - Continue with next phase
  - Ready for PR
  - Need to address regressions first

## Completion Detection

If all findings from original review are fixed:

```
🎉 All original findings addressed!

Original review: 8 issues
Current state: 0 issues

The API now passes AIP review. Ready to create PR?
```

## Example

User: `/api-validate thoughts/api/plans/2024-01-15-orders-api-plan.md`
