# getlarge Claude Plugins

A collection of Claude Code plugins for API design, security consulting, and development productivity.

## Installation

### Add the Marketplace

```bash
# In Claude Code
/plugin marketplace add getlarge/claude-aip-plugins
```

### Install Plugins

```bash
# Browse available plugins
/plugin

# Or install directly
/plugin install aip-api-design@getlarge-aip-plugins
```

## Available Plugins

### aip-api-design

Review and improve REST APIs following Google's [API Improvement Proposals (AIP)](https://google.aip.dev).

**Commands:**

- `/api-discover` — Find all OpenAPI specs in your project
- `/api-review` — Run AIP rules against a spec
- `/api-plan` — Create prioritized fix plan from review
- `/api-fix` — Implement fixes phase by phase
- `/api-validate` — Verify fixes and track progress

**Workflow:**

```
/api-discover → /api-review → /api-plan → /api-fix → /api-validate
                                              ↑            │
                                              └────────────┘
```

All artifacts are stored in `thoughts/api/` for persistence and human review.

[Full documentation →](./plugins/aip-api-design/README.md)

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add or improve plugins
4. Test with local marketplace
5. Submit a PR

## License

Apache 2.0
