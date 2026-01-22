# Claude AIP Plugins

**API hygiene tooling for Claude Code.**

---

## Why API Hygiene?

APIs rarely fail because of a single bad decision.
They fail because of small inconsistencies that compound over time.

One endpoint paginates differently.
Another returns errors in a custom format.
A third behaves slightly differently on retries.

Individually acceptable. Collectively expensive.

This plugin helps you catch hygiene issues before they become legacy problems.

### Hygiene vs Style

| Hygiene (enforce) | Style (choose) |
|-------------------|----------------|
| Pagination exists | Cursor vs offset |
| Errors are structured | Error code taxonomy |
| Idempotency on POST | Key header naming |
| No request body on GET | camelCase vs snake_case |

Style expresses your team's identity.
Hygiene protects your consumers.

This plugin focuses on hygiene—the baseline that makes APIs safe and predictable to use.

---

## The Foundation: Google's AIPs

This plugin uses [Google's API Improvement Proposals](https://google.aip.dev) as a starting point—200+ battle-tested patterns from billions of API calls.

But AIPs are one interpretation. The plugin is designed so you can:

- Use AIP rules as-is
- Adapt them to your context
- Add your own conventions
- Skip what doesn't apply

The goal isn't compliance. It's consistency.

---

## Installation

### Add the Marketplace

```bash
# In Claude Code
/plugin marketplace add getlarge/claude-aip-plugins
```

### Install the Plugin

```bash
# Browse available plugins
/plugin

# Or install directly
/plugin install aip-api-design@getlarge-aip-plugins
```

---

## Available Plugins

### aip-api-design

Review and improve REST APIs against hygiene rules derived from Google's AIPs.

**Commands:**

| Command | Purpose |
|---------|---------|
| `/api-discover` | Find all OpenAPI specs in your project |
| `/api-review` | Run hygiene rules against a spec |
| `/api-plan` | Create prioritized fix plan from review |
| `/api-fix` | Implement fixes phase by phase |
| `/api-validate` | Verify fixes and track progress |

**Workflow:**

```
/api-discover → /api-review → /api-plan → /api-fix → /api-validate
                                              ↑            │
                                              └────────────┘
```

Each step produces a document you can review, edit, and use as input for the next.

[Full documentation →](./plugins/aip-api-design/README.md)

---

## What It Catches

The reviewer checks for common hygiene issues:

**Consistency**
- Mixed naming conventions in paths
- Inconsistent pagination across list endpoints
- Non-standard error response formats

**Safety**
- Missing idempotency support on POST
- Unbounded list endpoints (no pagination)
- GET requests with body

**Predictability**
- Verbs in resource paths
- Non-standard HTTP status codes
- Missing error documentation

See [RULES.md](./plugins/aip-api-design/openapi-reviewer/RULES.md) for the full rule set.

---

## Philosophy

Read the [API Hygiene Manifesto](./docs/api-hygiene-manifesto.md) for the full rationale.

The short version:

> APIs are shared surfaces.
> Shared surfaces require hygiene.
> Not to impress. Not to show taste.
> But to be safe to use.

---

## Development

### Local Testing

```bash
# Clone the repo
git clone https://github.com/getlarge/claude-aip-plugins.git

# In Claude Code, add as local marketplace
/plugin marketplace add ./claude-aip-plugins

# Install and test
/plugin install aip-api-design@getlarge-aip-plugins
```

### Adding New Plugins

1. Create a new directory under `plugins/`
2. Add `.claude-plugin/plugin.json` manifest
3. Add commands, agents, skills as needed
4. Update `marketplace.json` with the new plugin entry

### Plugin Structure

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── commands/                # Slash commands
│   └── my-command.md
├── agents/                  # Specialized agents
│   └── my-agent.md
├── skills/                  # Knowledge/reference material
│   └── my-skill/
│       └── SKILL.md
└── README.md
```

---

## Contributing

1. Try the plugin on your real API projects
2. Annotate findings with feedback
3. Share patterns of false positives or missing rules
4. Submit PRs

---

## Further Reading

- [API Hygiene Manifesto](./docs/api-hygiene-manifesto.md) — The philosophy
- [API Hygiene Framework](./docs/api-hygiene-framework.md) — Practical reference with examples
- [Google AIPs](https://google.aip.dev) — The source material

---

## License

Apache 2.0
