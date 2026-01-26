---
description: Review an OpenAPI specification against API best practices (based on Google's AIP). Outputs a structured findings document.
argument-hint: [spec-path] [--categories naming,pagination]
---

# Baume Review

Analyze an OpenAPI specification against API best practices using the deterministic JS reviewer.

## Usage

```
/baume-review {spec-path}
/baume-review {spec-path} --categories naming,pagination
/baume-review  (will prompt for spec or use most recent from discovery)
```

## Instructions

1. **Resolve the spec path**:
   - If `$ARGUMENTS` provided, use that file path
   - If no argument, check for recent discovery doc in `.baume/discovery/`
   - If multiple specs in discovery, ask user which to review

2. **Choose review method** (prioritize MCP tools when available):

   **Option A: MCP Tool (Recommended)**

   If the `mcp__baume__baume-review` tool is available, use it:

   ```
   Use mcp__baume__baume-review with:
   - specPath: {absolute-path-to-spec}
   - categories (optional): ["naming", "pagination", "errors", ...]
   - skipRules (optional): ["rule-id-to-skip"]
   - strict (optional): false
   - lenient (optional): false (set to true if spec has validation issues)
   ```

   The MCP tool will:
   - Review the spec and return a reviewId
   - Cache findings for use with other tools (apply-fixes, correlate)
   - Provide findingsPath and findingsUrl for detailed results
   - Automatically fallback to lenient mode if strict OpenAPI validation fails

   Save the review document to `.baume/reviews/{YYYY-MM-DD}-{spec-name}-review.md`

   **Option B: Node.js CLI (Fallback)**

   If MCP tools are not available, use the plugin scripts at `${CLAUDE_PLUGIN_ROOT}`:

   ```bash
   # Create output directory and unique temp file
   mkdir -p .baume/reviews
   REVIEW_JSON=$(mktemp)

   # Step 1: Run review once, save JSON (this is the expensive operation)
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" {spec-path} --format json > "$REVIEW_JSON"

   # Step 2: Convert JSON to full markdown and save to file
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" --from-json "$REVIEW_JSON" --format markdown > .baume/reviews/{YYYY-MM-DD}-{spec-name}-review.md

   # Step 3: Convert JSON to summary for display (context-efficient)
   node "${CLAUDE_PLUGIN_ROOT}/openapi-reviewer/src/cli.js" --from-json "$REVIEW_JSON" --format summary

   # Step 4: Clean up temp file
   rm "$REVIEW_JSON"
   ```

   If `CLAUDE_PLUGIN_ROOT` is not set, find the plugin directory first:

   ```bash
   PLUGIN_DIR=$(find ~/.claude/plugins -name "baume@*" -type d 2>/dev/null | head -1)
   ```

   Optional flags for the review step:
   - `--strict` or `-s`: Treat warnings as errors
   - `--lenient` or `-l`: Skip strict OpenAPI validation (auto-fallback on failure)
   - `-c naming -c pagination`: Only run specific categories
   - `-x aip122/plural-resources`: Skip specific rules

   Available formats:
   - `--format json`: Machine-readable output (use as intermediate)
   - `--format markdown`: Full detailed output (save to file)
   - `--format summary`: Condensed output (display to user)
   - `--format sarif`: For CI/CD integration

3. **Present the summary** directly to the user (it's already formatted for display)

4. **Mention the full review location**:
   - Tell user: "Full review saved to `.baume/reviews/{filename}`"
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
User: /baume-review openapi.yaml
```
