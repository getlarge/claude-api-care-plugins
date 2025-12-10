# AIP API Design Plugin - Project Context

This document summarizes the research and development work done to create a Claude Code plugin for API design review following Google's API Improvement Proposals (AIP).

## Project Goal

Create tooling to help design and review REST APIs following Google's AIPs, adapted for OpenAPI/REST contexts (not just gRPC/protobuf).

### Target Use Cases

1. **Lint OpenAPI specs** against AIP rules
2. **Interactive design partner** for new APIs
3. **Evaluate existing APIs** against AIP principles
4. **Framework-specific fixes** (NestJS, Fastify)

### Priority AIP Areas

- Error handling (AIP-193, 194)
- Pagination (AIP-158)
- Filtering & sorting (AIP-160, 132)
- Long-running operations & jobs (AIP-151, 155)
- Field masks / partial updates (AIP-134)
- Batch operations (AIP-231+)
- Resource naming (AIP-122, 123)
- Standard methods (AIP-131 to 135)

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
    │   └── 2024-01-15-discovery.md
    ├── reviews/
    │   └── 2024-01-15-orders-api-review.md
    └── plans/
        └── 2024-01-15-orders-api-plan.md
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
    └── aip-api-design/                # The plugin
        ├── .claude-plugin/
        │   └── plugin.json            # Plugin manifest
        ├── README.md
        │
        ├── commands/                  # Slash commands
        │   ├── api-discover.md        # Find OpenAPI specs
        │   ├── api-review.md          # Run AIP rule checks
        │   ├── api-plan.md            # Create prioritized fix plan
        │   ├── api-fix.md             # Implement fixes phase-by-phase
        │   └── api-validate.md        # Verify fixes, update plan
        │
        ├── agents/
        │   └── aip-lookup.md          # Fetch specific AIPs on demand
        │
        ├── skills/
        │   └── aip-knowledge/         # Reference material
        │       ├── SKILL.md           # Quick reference, when to load what
        │       ├── errors.md          # AIP-193, 194
        │       ├── pagination.md      # AIP-158
        │       ├── filtering.md       # AIP-160, 132
        │       ├── lro.md             # AIP-151, 155 (long-running ops, jobs)
        │       ├── field-masks.md     # AIP-134 (partial updates)
        │       ├── batch.md           # AIP-231+ (batch operations)
        │       └── rest-mapping.md    # Proto concepts → REST/OpenAPI
        │
        └── scripts/                   # Standalone JS reviewer (optional)
            ├── package.json
            └── src/
                ├── index.js           # Library entry point
                ├── rules.js           # 11 default AIP rules
                ├── reviewer.js        # OpenAPIReviewer class
                ├── formatters.js      # Console, Markdown, JSON, SARIF output
                ├── cli.js             # Command-line interface
                └── types.ts           # TypeScript definitions (JSDoc compatible)
```

---

## AIP Rules Implemented (in scripts/)

The standalone reviewer includes these rules:

| Rule ID                       | Category    | Severity   | Description                             |
| ----------------------------- | ----------- | ---------- | --------------------------------------- |
| `naming/plural-resources`     | naming      | warning    | Resource names should be plural         |
| `naming/no-verbs`             | naming      | warning    | No verbs in paths, use HTTP methods     |
| `methods/get-no-body`         | methods     | error      | GET must not have request body          |
| `methods/post-returns-201`    | methods     | warning    | POST should return 201/202              |
| `methods/patch-over-put`      | methods     | suggestion | Prefer PATCH for partial updates        |
| `pagination/list-paginated`   | pagination  | warning    | List endpoints need pagination          |
| `pagination/max-page-size`    | pagination  | suggestion | Page size needs maximum limit           |
| `errors/schema-defined`       | errors      | warning    | Consistent error schema required        |
| `errors/responses-documented` | errors      | suggestion | Document error responses                |
| `idempotency/post-has-key`    | idempotency | suggestion | POST should accept Idempotency-Key      |
| `filtering/list-filterable`   | filtering   | suggestion | List endpoints should support filtering |

### Finding Structure

```typescript
interface Finding {
  ruleId: string; // e.g., "pagination/list-paginated"
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

- **Rule:** `pagination/list-paginated`

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

- `naming/plural-resources` triggers on `/health` (should be exception)

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

### Framework Fixers

- NestJS: Generate decorators, DTOs, exception filters from findings
- Fastify: Generate schemas, error handlers from findings

### Integrations

- Export as Spectral ruleset for CI/CD
- SARIF output for IDE integration
- GitHub Actions workflow

### GraphQL Variant

- Separate skill or mapping guide for GraphQL APIs

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
