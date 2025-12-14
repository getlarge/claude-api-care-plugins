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

2. **Run the AIP reviewer once, generate all outputs efficiently**:

   The plugin scripts are located at `${CLAUDE_PLUGIN_ROOT}`. Run the review once, save JSON, then convert to other formats:

   ```bash
   # Create output directory and unique temp file
   mkdir -p thoughts/api/reviews
   REVIEW_JSON=$(mktemp)

   # Step 1: Run review once, save JSON (this is the expensive operation)
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" {spec-path} --format json > "$REVIEW_JSON"

   # Step 2: Convert JSON to full markdown and save to file
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" --from-json "$REVIEW_JSON" --format markdown > thoughts/api/reviews/{YYYY-MM-DD}-{spec-name}-review.md

   # Step 3: Convert JSON to summary for display (context-efficient)
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" --from-json "$REVIEW_JSON" --format summary

   # Step 4: Clean up temp file
   rm "$REVIEW_JSON"
   ```

   If `CLAUDE_PLUGIN_ROOT` is not set, find the plugin directory first:

   ```bash
   PLUGIN_DIR=$(find ~/.claude/plugins -name "aip-api-design@*" -type d 2>/dev/null | head -1)
   ```

   Optional flags for the review step:
   - `--strict` or `-s`: Treat warnings as errors
   - `-c naming -c pagination`: Only run specific categories
   - `-x naming/plural-resources`: Skip specific rules

   Available formats:
   - `--format json`: Machine-readable output (use as intermediate)
   - `--format markdown`: Full detailed output (save to file)
   - `--format summary`: Condensed output (display to user)
   - `--format sarif`: For CI/CD integration

3. **Present the summary** directly to the user (it's already formatted for display)

4. **Mention the full review location**:
   - Tell user: "Full review saved to `thoughts/api/reviews/{filename}`"
   - Recommend next step based on summary's "Next Step" section

## Supported Rules

The reviewer checks 17 rules across 6 categories. See `openapi-reviewer/RULES.md` for full documentation.

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
