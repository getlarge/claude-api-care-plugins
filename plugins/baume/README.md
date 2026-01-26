# Baume

A Claude Code plugin for reviewing and improving REST APIs following Google's API Improvement Proposals (AIP).

## Installation

### Via Claude Code Plugin System

```bash
# Add the getlarge marketplace
/plugin marketplace add getlarge/claude-api-care-plugins

# Install the plugin
/plugin install baume@getlarge-baume-plugins
```

### Via Local Clone (for development)

```bash
# Clone the marketplace
git clone https://github.com/getlarge/claude-api-care-plugins.git

# In Claude Code
/plugin marketplace add ./claude-api-care-plugins
/plugin install baume@getlarge-baume-plugins
```

### Standalone Reviewer (Optional)

The plugin includes a JavaScript-based OpenAPI reviewer for faster, more deterministic analysis. Dependencies are auto-installed on first session, but you can also install manually:

```bash
cd ~/.claude/plugins/baume@*/scripts
npm install
```

**Requirements:** Node.js 18+

Without the standalone reviewer, commands still work using Claude's built-in analysis.

## Workflow

This plugin follows a **progressive disclosure** pattern. Each command produces a well-structured markdown document that becomes input for the next step:

```
┌───────────────┐    ┌───────────────┐    ┌─────────────┐    ┌───────────┐    ┌─────────────────┐
│   DISCOVER    │───▶│    REVIEW     │───▶│    PLAN     │───▶│    FIX    │───▶│    VALIDATE     │
│               │    │               │    │             │    │           │    │                 │
│/baume-discover│    │ /baume-review │    │ /baume-plan │    │/baume-fix │    │ /baume-validate │
└───────────────┘    └───────────────┘    └─────────────┘    └───────────┘    └─────────────────┘
       │                    │                   │                  │                   │
       ▼                    ▼                   ▼                  ▼                   ▼
    .baume/              .baume/             .baume/            (code              .baume/
    discovery/           reviews/            plans/             changes)           plans/
    YYYY-MM-DD-*.md      YYYY-MM-DD-*.md     YYYY-MM-DD-*.md                       (updated)
```

### Commands

| Command                  | Input            | Output             | Skip When         |
| ------------------------ | ---------------- | ------------------ | ----------------- |
| `/baume-discover`        | (scans codebase) | Discovery document | Spec path known   |
| `/baume-review {spec}`   | OpenAPI spec     | Review findings    | Already reviewed  |
| `/baume-plan {review}`   | Review document  | Prioritized plan   | Few obvious fixes |
| `/baume-fix {plan}`      | Plan document    | Code changes       | Manual preferred  |
| `/baume-validate {plan}` | Plan document    | Updated plan       | Quick check       |

### Example Session

```bash
# 1. Find all OpenAPI specs in the project
/baume-discover

# 2. Review a specific spec
/baume-review openapi/orders-api.yaml

# 3. Create a fix plan from the review
/baume-plan .baume/reviews/2025-01-15-orders-api-review.md

# 4. Implement fixes (phase by phase)
/baume-fix .baume/plans/2025-01-15-orders-api-plan.md

# 5. Validate fixes were applied correctly
/baume-validate .baume/plans/2025-01-15-orders-api-plan.md
```

For detailed flow diagrams and architecture, see [User Flows Documentation](docs/user-flows.md).

## The `.baume/` Directory

All documents are stored in `.baume/`:

```
.baume/
├── discovery/
│   └── 2025-01-15-discovery.md
├── reviews/
│   └── 2025-01-15-orders-api-review.md
└── plans/
    └── 2025-01-15-orders-api-plan.md
```

These documents:

- Persist across sessions
- Can be reviewed and edited by humans
- Serve as input for subsequent commands
- Track progress on multi-phase fixes

## Providing Feedback

The best way to improve this plugin is through annotated review documents.

### Option 1: Annotate Findings

After `/baume-review`, edit the review document to add feedback:

```markdown
#### 🟡 `GET /orders` — Missing pagination

- **Rule:** `aip158/list-paginated`
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

- `aip122/plural-resources` triggers on `/health` endpoint (should be exception)

### Missing Rules

- No check for required `Content-Type` header on POST/PATCH
- Should warn about `PUT` for partial updates (use `PATCH` instead)

### Severity Adjustments

- `aip155/idempotency-key` should be suggestion, not warning for internal APIs
```

## AIP Reference

The plugin includes curated AIP knowledge in `skills/aip-knowledge/`. For deeper guidance, the `baume-lookup` agent can fetch specific AIPs on demand:

> "Why does the review say I need cursor-based pagination?"

The agent will fetch AIP-158 and explain the rationale.

## Structure

```
baume/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── .mcp.json                 # MCP server configuration
├── commands/                 # 5 slash commands
│   ├── baume-discover.md     # Find OpenAPI specs
│   ├── baume-review.md       # Run AIP rules
│   ├── baume-plan.md         # Create fix plan
│   ├── baume-fix.md          # Implement fixes
│   └── baume-validate.md     # Verify fixes
├── agents/                   # 2 agents
│   ├── baume-lookup.md       # Fetch/explain AIPs on demand
│   └── baume-code-locator.md # Locate code for API endpoints
├── hooks/
│   └── hooks.json            # Hook definitions
├── skills/
│   ├── aip-knowledge/        # Reference material (9 files)
│   │   ├── SKILL.md          # Quick reference
│   │   ├── errors.md         # AIP-193, 194
│   │   ├── pagination.md     # AIP-158
│   │   ├── filtering.md      # AIP-160, 132
│   │   ├── lro.md            # AIP-151, 155
│   │   ├── field-masks.md    # AIP-134
│   │   ├── batch.md          # AIP-231+
│   │   ├── rest-mapping.md   # Proto → REST
│   │   └── linter-rules.md   # All 17 rules reference
│   └── baume-code-correlator/  # Code correlation guidance
│       ├── SKILL.md
│       └── diff-templates.md
├── openapi-reviewer/         # Standalone JS reviewer (17 rules)
│   ├── package.json
│   ├── RULES.md              # Rule documentation
│   └── src/
│       ├── cli.js            # Review CLI
│       ├── discover.js       # Discovery CLI
│       ├── rules/            # Rules: aip122, aip131-135, aip155, aip158, aip193
│       ├── reviewer.js
│       ├── fixer.js
│       └── formatters.js     # Console, Markdown, JSON, SARIF
└── mcp-server/               # MCP server (@getlarge/fastify-mcp)
    └── src/
        ├── tools/            # 5 MCP tools
        ├── prompts/          # 2 MCP prompts
        ├── resources/        # 2 MCP resources
        └── services/         # Storage, subscriptions
```

## Contributing

1. Try the plugin on your real API projects
2. Annotate findings with feedback (see above)
3. Share patterns of false positives or missing rules
4. Submit PRs to [getlarge/claude-api-care-plugins](https://github.com/getlarge/claude-api-care-plugins)

## License

Apache 2.0
