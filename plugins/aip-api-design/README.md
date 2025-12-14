# AIP API Design Plugin

A Claude Code plugin for reviewing and improving REST APIs following Google's API Improvement Proposals (AIP).

## Installation

### Via Claude Code Plugin System

```bash
# Add the getlarge marketplace
/plugin marketplace add getlarge/claude-aip-plugins

# Install the plugin
/plugin install aip-api-design@getlarge-aip-plugins
```

### Via Local Clone (for development)

```bash
# Clone the marketplace
git clone https://github.com/getlarge/claude-aip-plugins.git

# In Claude Code
/plugin marketplace add ./claude-aip-plugins
/plugin install aip-api-design@getlarge-aip-plugins
```

### Standalone Reviewer (Optional)

The plugin includes a JavaScript-based OpenAPI reviewer for faster, more deterministic analysis. Dependencies are auto-installed on first session, but you can also install manually:

```bash
cd ~/.claude/plugins/aip-api-design@*/scripts
npm install
```

**Requirements:** Node.js 18+

Without the standalone reviewer, commands still work using Claude's built-in analysis.

## Workflow

This plugin follows a **progressive disclosure** pattern. Each command produces a well-structured markdown document that becomes input for the next step:

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

| Command                | Input            | Output             | Skip When         |
| ---------------------- | ---------------- | ------------------ | ----------------- |
| `/api-discover`        | (scans codebase) | Discovery document | Spec path known   |
| `/api-review {spec}`   | OpenAPI spec     | Review findings    | Already reviewed  |
| `/api-plan {review}`   | Review document  | Prioritized plan   | Few obvious fixes |
| `/api-fix {plan}`      | Plan document    | Code changes       | Manual preferred  |
| `/api-validate {plan}` | Plan document    | Updated plan       | Quick check       |

### Example Session

```bash
# 1. Find all OpenAPI specs in the project
/api-discover

# 2. Review a specific spec
/api-review openapi/orders-api.yaml

# 3. Create a fix plan from the review
/api-plan thoughts/api/reviews/2024-01-15-orders-api-review.md

# 4. Implement fixes (phase by phase)
/api-fix thoughts/api/plans/2024-01-15-orders-api-plan.md

# 5. Validate fixes were applied correctly
/api-validate thoughts/api/plans/2024-01-15-orders-api-plan.md
```

For detailed flow diagrams and architecture, see [User Flows Documentation](docs/user-flows.md).

## The `thoughts/` Directory

All documents are stored in `thoughts/api/`:

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

These documents:

- Persist across sessions
- Can be reviewed and edited by humans
- Serve as input for subsequent commands
- Track progress on multi-phase fixes

## Providing Feedback

The best way to improve this plugin is through annotated review documents.

### Option 1: Annotate Findings

After `/api-review`, edit the review document to add feedback:

```markdown
#### 🟡 `GET /orders` — Missing pagination

- **Rule:** `pagination/list-paginated`
- **AIP:** [AIP-158](https://google.aip.dev/158)
- **Message:** List endpoint missing pagination parameters

<!-- FEEDBACK: false-positive - this endpoint is internal-only with max 10 items -->
```

### Option 2: Add Context to Plans

Edit the plan document to adjust priorities or add context:

```markdown
### Task 2.1: Add pagination to list endpoints

- [ ] `GET /orders` — add page_size, page_token parameters

<!-- FEEDBACK: skip - internal endpoint, not worth the effort -->
<!-- FEEDBACK: severity-should-be: suggestion (not warning) -->
```

### Option 3: Track Patterns

If you find recurring false positives or missing rules, note them:

```markdown
## Feedback for Plugin Improvement

### False Positives

- `naming/plural-resources` triggers on `/health` endpoint (should be exception)

### Missing Rules

- No check for required `Content-Type` header on POST/PATCH
- Should warn about `PUT` for partial updates (use `PATCH` instead)

### Severity Adjustments

- `idempotency/post-has-key` should be suggestion, not warning for internal APIs
```

## AIP Reference

The plugin includes curated AIP knowledge in `skills/aip-knowledge/`. For deeper guidance, the `aip-lookup` agent can fetch specific AIPs on demand:

> "Why does the review say I need cursor-based pagination?"

The agent will (hopefully) fetch AIP-158 and explain the rationale.

## Structure

```
aip-api-design/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── commands/
│   ├── api-discover.md       # Find OpenAPI specs
│   ├── api-review.md         # Run AIP rules
│   ├── api-plan.md           # Create fix plan
│   ├── api-fix.md            # Implement fixes
│   └── api-validate.md       # Verify fixes
├── agents/
│   └── aip-lookup.md         # Fetch/explain AIPs on demand
├── hooks/
│   ├── hooks.json            # SessionStart hook config
│   └── setup-deps.sh         # Auto-install dependencies
├── skills/
│   └── aip-knowledge/
│       ├── SKILL.md          # Quick reference
│       ├── errors.md         # AIP-193, 194
│       ├── pagination.md     # AIP-158
│       ├── filtering.md      # AIP-160, 132
│       ├── lro.md            # AIP-151, 155
│       ├── field-masks.md    # AIP-134
│       ├── batch.md          # AIP-231+
│       └── rest-mapping.md   # Proto → REST
└── scripts/                  # Standalone reviewer
    ├── package.json
    ├── RULES.md              # Rule documentation
    └── src/
        ├── cli.js            # Review CLI
        ├── discover.js       # Discovery CLI
        ├── rules.js          # 17 AIP rules
        ├── rules.test.js     # 50 tests
        ├── reviewer.js
        ├── formatters.js
        └── types.ts
```

## Contributing

1. Try the plugin on your real API projects
2. Annotate findings with feedback (see above)
3. Share patterns of false positives or missing rules
4. Submit PRs to [getlarge/claude-aip-plugins](https://github.com/getlarge/claude-aip-plugins)

## License

Apache 2.0
