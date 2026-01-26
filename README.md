# getlarge Claude Plugins

A collection of Claude Code plugins for API design, security consulting, and development productivity.

## Installation

### Add the Marketplace

```bash
# In Claude Code
/plugin marketplace add getlarge/claude-api-care-plugins
```

### Install Plugins

```bash
# Browse available plugins
/plugin

# Or install directly
/plugin install baume@getlarge-baume-plugins
```

## Available Plugins

### Baume

Review and improve REST APIs following Google's [API Improvement Proposals (AIP)](https://google.aip.dev).

**Commands:**

- `/baume-discover` — Find all OpenAPI specs in your project
- `/baume-review` — Run AIP rules against a spec
- `/baume-plan` — Create prioritized fix plan from review
- `/baume-fix` — Implement fixes phase by phase
- `/baume-validate` — Verify fixes and track progress

**Workflow:**

```
/baume-discover → /baume-review → /baume-plan → /baume-fix → /baume-validate
                                                      ↑            │
                                                      └────────────┘
```

All artifacts are stored in `.baume/` for persistence and human review.

[Full documentation →](./plugins/baume/README.md)

## Roadmap

### Baume Plugin

**Current (v0.2.x):**

- 17 AIP-based rules for REST API linting
- Code correlation for NestJS, Fastify, Express
- Auto-fix support for OpenAPI specs
- MCP server for Claude Code integration

**Planned:**

| Feature                     | Description                                                                    | Status      |
| --------------------------- | ------------------------------------------------------------------------------ | ----------- |
| **Declarative Rule Engine** | Custom rules via YAML — no code execution, CEL sandbox for complex expressions | 🔬 Research |
| **Custom Rulesets**         | Presets (strict, standard, minimal) + company-specific rule configurations     | 🔬 Research |
| **API Hygiene Scoring**     | Score APIs on a 0-100 scale with levels (Biohazard → Operating Room)           | 🔬 Research |
| **Coaching Dashboard**      | Track API quality over time, get prioritized fix suggestions                   | 📋 Planned  |
| **Rule Distribution**       | Local rules in `.api-hygiene/`, future registry for shared rules               | 📋 Planned  |

See [research notes](./thoughts/shared/research/2026-01-25-api-hygiene-coaching.md) for detailed designs.

## Development

### Local Testing

```bash
# Clone the repo
git clone https://github.com/getlarge/claude-api-care-plugins.git

# In Claude Code, add as local marketplace
/plugin marketplace add ./claude-api-care-plugins

# Install and test
/plugin install baume@getlarge-baume-plugins
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add or improve plugins
4. Test with local marketplace
5. Submit a PR

## License

Apache 2.0
