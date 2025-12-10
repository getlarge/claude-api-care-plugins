---
description: Review an OpenAPI specification against AIP (API Improvement Proposals) principles. Outputs a structured findings document.
---

# API Review

Analyze an OpenAPI specification against Google's API Improvement Proposals (AIP) using the deterministic JS reviewer.

## Usage

```
/api-review {spec-path}
/api-review {spec-path} --categories naming,pagination
/api-review  (will prompt for spec or use most recent from discovery)
```

## Instructions

1. **Resolve the spec path**:
   - If `$ARGUMENTS` provided, use that file path
   - If no argument, check for recent discovery doc in `thoughts/api/discovery/`
   - If multiple specs in discovery, ask user which to review

2. **Run the AIP reviewer script**:

   The plugin scripts are located at `${CLAUDE_PLUGIN_ROOT}`. Run:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/src/cli.js" {spec-path} --format markdown
   ```

   If `CLAUDE_PLUGIN_ROOT` is not set, find the plugin directory first:

   ```bash
   PLUGIN_DIR=$(find ~/.claude/plugins -name "aip-api-design@*" -type d 2>/dev/null | head -1)
   node "${PLUGIN_DIR}/scripts/src/cli.js" {spec-path} --format markdown
   ```

   Optional flags:
   - `--strict` or `-s`: Treat warnings as errors
   - `--format markdown`: Output as markdown (default for this command)
   - `--format json`: Machine-readable output
   - `-c naming -c pagination`: Only run specific categories
   - `-x naming/plural-resources`: Skip specific rules

3. **Save the output** to:

   ```
   thoughts/api/reviews/{YYYY-MM-DD}-{spec-name}-review.md
   ```

4. **Present summary to user**:
   - Total findings by severity (errors, warnings, suggestions)
   - Most critical issues
   - Recommend next step: `/api-plan {review-path}`

## Supported Rules

The reviewer checks 17 rules across 6 categories. See `scripts/RULES.md` for full documentation.

| Category         | Rules | AIPs               |
| ---------------- | ----- | ------------------ |
| naming           | 4     | AIP-122, AIP-131   |
| standard-methods | 4     | AIP-131 to AIP-135 |
| pagination       | 3     | AIP-158            |
| errors           | 3     | AIP-193            |
| idempotency      | 1     | AIP-155            |
| filtering        | 2     | AIP-132, AIP-160   |

## Example Session

```
User: /api-review openapi.yaml
```
