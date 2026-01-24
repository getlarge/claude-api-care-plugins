# AIP API Design Plugin - Project Context

This document summarizes the Claude Code plugin for API design review following Google's API Improvement Proposals (AIP).

## Project Goal

Create tooling to help design and review REST APIs following Google's AIPs, adapted for OpenAPI/REST contexts (not just gRPC/protobuf).

### Target Use Cases

1. **Lint OpenAPI specs** against AIP rules (17 rules implemented)
2. **Interactive design partner** for new APIs
3. **Evaluate existing APIs** against AIP principles
4. **Correlate findings with code locations** (NestJS, Fastify, Express)
5. **Apply automated fixes** to OpenAPI specs

### Implemented AIP Areas

- Resource naming (AIP-122) — 4 rules
- Standard methods (AIP-131 to 135) — 5 rules
- Pagination (AIP-158) — 3 rules
- Error handling (AIP-193) — 3 rules
- Idempotency (AIP-155) — 1 rule
- Filtering & sorting (AIP-132, 160) — 2 rules

---

## Architecture Decision: Spec-First

We chose a **spec-first, framework-agnostic** approach:

```
OpenAPI Spec (YAML/JSON)
    ↓
AIP Reviewer (Framework-Agnostic)
  • Analyzes spec against AIP rules
  • Outputs structured findings with context
  • Machine-readable (JSON, Markdown)
    ↓
Framework-Specific Fixers (Future)
  • NestJS: Decorators, DTOs, interceptors
  • Fastify: Schemas, hooks, plugins
```

**Rationale:** Core AIP rules are universal; only remediation code is framework-specific. This allows the reviewer to work on any OpenAPI spec regardless of how it was generated.

---

## Workflow: Progressive Disclosure

Inspired by HumanLayer's command structure, the plugin follows a **progressive disclosure** pattern where each step produces a well-structured markdown document that becomes input for the next:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DISCOVER   │───▶│   REVIEW    │───▶│    PLAN     │───▶│     FIX     │───▶│  VALIDATE   │
│             │    │             │    │             │    │             │    │             │
│/api-discover│    │ /api-review │    │  /api-plan  │    │  /api-fix   │    │/api-validate│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼                  ▼
   thoughts/          thoughts/          thoughts/          (code             thoughts/
   api/discovery/     api/reviews/       api/plans/         changes)          api/plans/
   YYYY-MM-DD-*.md    YYYY-MM-DD-*.md    YYYY-MM-DD-*.md                      (updated)
```

### Commands

| Command                | Input             | Output                                | Skip When                 |
| ---------------------- | ----------------- | ------------------------------------- | ------------------------- |
| `/api-discover`        | (scans codebase)  | Discovery document listing all specs  | Spec path already known   |
| `/api-review {spec}`   | OpenAPI spec file | Review findings document              | Already reviewed recently |
| `/api-plan {review}`   | Review document   | Prioritized fix plan with phases      | Few obvious fixes         |
| `/api-fix {plan}`      | Plan document     | Code changes, updates plan checkboxes | Manual fixes preferred    |
| `/api-validate {plan}` | Plan document     | Re-runs review, updates plan status   | Quick iteration           |

### The `thoughts/` Directory Pattern

All generated documents live in `thoughts/api/`:

```
thoughts/
└── api/
    ├── discovery/
    │   └── 2025-01-15-discovery.md
    ├── reviews/
    │   └── 2025-01-15-orders-api-review.md
    └── plans/
        └── 2025-01-15-orders-api-plan.md
```

**Why this matters:**

- Documents persist across Claude Code sessions
- Human-editable for feedback and adjustments
- Each document has YAML frontmatter for machine parsing
- Creates audit trail of API improvements

---

## Plugin Structure

```
claude-aip-plugins/                    # Marketplace root
├── .claude-plugin/
│   └── marketplace.json               # Lists available plugins
├── README.md
└── plugins/
    └── aip-api-design/                # The plugin (v0.2.1)
        ├── .claude-plugin/
        │   └── plugin.json            # Plugin manifest
        ├── .mcp.json                  # MCP server configuration
        ├── README.md
        │
        ├── commands/                  # Slash commands (5)
        │   ├── api-discover.md        # Find OpenAPI specs
        │   ├── api-review.md          # Run AIP rule checks
        │   ├── api-plan.md            # Create prioritized fix plan
        │   ├── api-fix.md             # Implement fixes phase-by-phase
        │   └── api-validate.md        # Verify fixes, update plan
        │
        ├── agents/                    # Agents (2)
        │   ├── aip-lookup.md          # Fetch specific AIPs on demand
        │   └── aip-code-locator.md    # Locate code related to API findings
        │
        ├── skills/
        │   ├── aip-knowledge/         # Reference material (9 files)
        │   │   ├── SKILL.md           # Quick reference, when to load what
        │   │   ├── errors.md          # AIP-193, 194
        │   │   ├── pagination.md      # AIP-158
        │   │   ├── filtering.md       # AIP-160, 132
        │   │   ├── lro.md             # AIP-151, 155 (long-running ops, jobs)
        │   │   ├── field-masks.md     # AIP-134 (partial updates)
        │   │   ├── batch.md           # AIP-231+ (batch operations)
        │   │   ├── rest-mapping.md    # Proto concepts → REST/OpenAPI
        │   │   └── linter-rules.md    # All 17 automated rules reference
        │   │
        │   └── aip-code-correlator/   # Code correlation guidance
        │       ├── SKILL.md           # Code correlation skill guide
        │       └── diff-templates.md  # Diff generation templates
        │
        ├── hooks/
        │   └── hooks.json             # Hook definitions
        │
        ├── openapi-reviewer/          # Standalone JS reviewer library
        │   ├── package.json
        │   ├── RULES.md               # Full rule documentation
        │   └── src/
        │       ├── index.js           # Library entry point
        │       ├── rules/             # 17 AIP rules (aip122, aip131-135, aip155, aip158, aip193)
        │       ├── reviewer.js        # OpenAPIReviewer class
        │       ├── fixer.js           # OpenAPIFixer class
        │       ├── discover.js        # Spec discovery
        │       ├── formatters.js      # Console, Markdown, JSON, SARIF output
        │       └── cli.js             # Command-line interface
        │
        └── mcp-server/                # MCP server (@platformatic/mcp)
            ├── package.json
            └── src/
                ├── server.ts          # Main server (Fastify-based)
                ├── tools/             # 5 MCP tools
                ├── prompts/           # 2 MCP prompts
                ├── resources/         # 2 MCP resources
                ├── services/          # Storage backends, subscriptions
                └── plugins/           # Auth (OIDC/OAuth) & security
```

---

## AIP Rules Implemented (17 rules)

The standalone reviewer includes these rules organized by AIP number:

### Naming (AIP-122) — 4 rules

| Rule ID                    | Severity   | Description                         |
| -------------------------- | ---------- | ----------------------------------- |
| `aip122/plural-resources`  | warning    | Resource names should be plural     |
| `aip122/no-verbs`          | error      | No verbs in paths, use HTTP methods |
| `aip122/consistent-casing` | warning    | Consistent casing across all paths  |
| `aip122/nested-ownership`  | suggestion | Nested params should reflect parent |

### Standard Methods (AIP-131 to 135) — 5 rules

| Rule ID                       | Severity   | Description                          |
| ----------------------------- | ---------- | ------------------------------------ |
| `aip131/get-no-body`          | error      | GET must not have request body       |
| `aip133/post-returns-created` | suggestion | POST should return 201/202           |
| `aip134/patch-over-put`       | suggestion | Prefer PATCH for partial updates     |
| `aip135/delete-idempotent`    | warning    | DELETE should be idempotent, no body |

### Pagination (AIP-158) — 3 rules

| Rule ID                          | Severity   | Description                           |
| -------------------------------- | ---------- | ------------------------------------- |
| `aip158/list-paginated`          | warning    | List endpoints need pagination        |
| `aip158/max-page-size`           | suggestion | Page size needs maximum limit         |
| `aip158/response-has-next-token` | warning    | Response must include next_page_token |

### Errors (AIP-193) — 3 rules

| Rule ID                       | Severity   | Description                      |
| ----------------------------- | ---------- | -------------------------------- |
| `aip193/schema-defined`       | warning    | Consistent error schema required |
| `aip193/responses-documented` | suggestion | Document error responses         |
| `aip193/standard-codes`       | suggestion | Use standard HTTP error codes    |

### Idempotency (AIP-155) — 1 rule

| Rule ID                  | Severity   | Description                        |
| ------------------------ | ---------- | ---------------------------------- |
| `aip155/idempotency-key` | suggestion | POST should accept Idempotency-Key |

### Filtering (AIP-132, 160) — 2 rules

| Rule ID                | Severity   | Description                             |
| ---------------------- | ---------- | --------------------------------------- |
| `aip132/has-filtering` | suggestion | List endpoints should support filtering |
| `aip132/has-ordering`  | suggestion | List endpoints should support ordering  |

### Finding Structure

```typescript
interface Finding {
  ruleId: string; // e.g., "aip158/list-paginated"
  severity: 'error' | 'warning' | 'suggestion';
  category: string; // e.g., "pagination"
  path: string; // e.g., "GET /users"
  message: string; // Human-readable explanation
  aip?: string; // e.g., "AIP-158"
  suggestion?: string; // How to fix
  context?: object; // Machine-readable data for fixers
}
```

---

## MCP Server Features

The MCP server exposes the reviewer functionality via the Model Context Protocol using `@platformatic/mcp`.

### Tools (5)

| Tool              | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `aip-review`      | Analyze OpenAPI spec against AIP guidelines. Returns reviewId for caching. |
| `aip-list-rules`  | List available rules. Filter by AIP number or category.                    |
| `aip-get-info`    | Get information about a specific AIP (summary and link).                   |
| `aip-apply-fixes` | Apply suggested fixes to spec. Supports writeBack for local files.         |
| `aip-correlate`   | Correlate findings with code locations (NestJS, Fastify, Express).         |

### Prompts (2)

| Prompt         | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `code-locator` | Generate instructions for finding API endpoint code in a project. |
| `aip-lookup`   | Generate instructions for fetching and explaining a specific AIP. |

### Resources (2)

| URI Pattern                    | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `aip://findings?id={reviewId}` | Access cached review findings by review ID. |
| `aip://specs?id={specId}`      | Access modified OpenAPI specs by spec ID.   |

Resources support subscriptions for real-time updates (memory or Redis backend).

### Storage Backends

- **Findings**: File-based or memory storage for review results
- **Temp Specs**: Temporary storage for modified specs with signed URLs
- **Subscriptions**: Memory or Redis for resource subscription notifications

### Authentication

Supports OIDC discovery and OAuth flows for secured deployments.

---

## Key Design Principles

### 1. Progressive Disclosure

- Don't load everything into context at once
- SKILL.md is a quick reference; detailed references loaded on demand
- Each command produces focused output for the next step

### 2. Human-in-the-Loop

- All documents are human-editable
- Feedback via HTML comments: `<!-- FEEDBACK: false-positive -->`
- Plan phases require confirmation before proceeding

### 3. Spec as Source of Truth

- Always update OpenAPI spec first
- Code changes follow spec changes
- Framework-specific code is generated from spec findings

### 4. Fetch AIPs On Demand

- Don't bundle all 200+ AIPs
- The `aip-lookup` agent fetches from https://google.aip.dev/{number}
- Raw markdown available at https://github.com/aip-dev/google.aip.dev

---

## Feedback Workflow

To improve the plugin based on real usage:

### Option 1: Annotate Review Findings

```markdown
#### 🟡 `GET /orders` — Missing pagination

- **Rule:** `aip158/list-paginated`

<!-- FEEDBACK: false-positive - internal endpoint with max 10 items -->
```

### Option 2: Adjust Plan Priorities

```markdown
### Task 2.1: Add pagination

- [ ] `GET /orders`

<!-- FEEDBACK: skip - not worth effort for internal API -->
<!-- FEEDBACK: severity-should-be: suggestion -->
```

### Option 3: Track Patterns

```markdown
## Plugin Feedback

### False Positives

- `aip122/plural-resources` triggers on `/health` (should be exception)

### Missing Rules

- No check for required `Content-Type` header on POST/PATCH
```

---

## Installation & Testing

### Add Marketplace

```bash
# From GitHub (once pushed)
/plugin marketplace add getlarge/claude-aip-plugins

# Or locally during development
/plugin marketplace add ./path/to/claude-aip-plugins
```

### Install Plugin

```bash
/plugin install aip-api-design@getlarge-aip-plugins
```

### Test the Workflow

```bash
# 1. Find specs
/api-discover

# 2. Review a spec
/api-review openapi.yaml

# 3. Create fix plan
/api-plan thoughts/api/reviews/YYYY-MM-DD-review.md

# 4. Implement fixes
/api-fix thoughts/api/plans/YYYY-MM-DD-plan.md

# 5. Validate
/api-validate thoughts/api/plans/YYYY-MM-DD-plan.md
```

---

## Future Work

### More Rules

- Long-running operations (AIP-151)
- Batch operations (AIP-231)
- Security schemes
- Versioning patterns
- Authorization patterns
- Custom methods (AIP-136)

### Framework-Specific Code Fixers

The `aip-correlate` tool locates code, but automated code fixes are not yet implemented:

- NestJS: Generate decorators, DTOs, exception filters from findings
- Fastify: Generate schemas, error handlers from findings
- Express: Generate middleware and validators from findings

### Integrations

- Export as Spectral ruleset for CI/CD
- GitHub Actions workflow for PR reviews

### Already Implemented ✓

- ~~SARIF output for IDE integration~~ (formatters.js supports SARIF)
- ~~Framework detection~~ (aip-correlate supports NestJS, Fastify, Express)
- ~~Code location correlation~~ (aip-correlate tool)
- ~~MCP resources with subscriptions~~ (memory + Redis backends)

---

## Repository

- **Marketplace:** https://github.com/getlarge/claude-aip-plugins
- **AIP Source:** https://github.com/aip-dev/google.aip.dev

---

## Quick Reference: AIP Numbers

| AIP | Topic                    |
| --- | ------------------------ |
| 121 | Resource-oriented design |
| 122 | Resource names           |
| 123 | Resource types           |
| 131 | Get                      |
| 132 | List (includes ordering) |
| 133 | Create                   |
| 134 | Update (field masks)     |
| 135 | Delete                   |
| 136 | Custom methods           |
| 151 | Long-running operations  |
| 155 | Request identification   |
| 158 | Pagination               |
| 160 | Filtering                |
| 161 | Field masks              |
| 180 | Backwards compatibility  |
| 193 | Errors                   |
| 194 | Automatic retry          |
| 231 | Batch methods            |
