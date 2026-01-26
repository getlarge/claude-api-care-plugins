# Baume Plugin - User Flows

This document describes the expected user flows for the Baume API Design plugin.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ENTRY POINTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   "I have an OpenAPI spec"          "I have a code-first project"           │
│            │                                    │                            │
│            ▼                                    ▼                            │
│      /baume-review                       /baume-discover                     │
│            │                                    │                            │
│            │                                    ▼                            │
│            │                         (finds openapi.yaml)                    │
│            │                                    │                            │
│            └──────────────┬─────────────────────┘                            │
│                           ▼                                                  │
│                      /baume-plan                                             │
│                           │                                                  │
│                           ▼                                                  │
│                      /baume-fix                                              │
│                           │                                                  │
│                           ▼                                                  │
│                    /baume-validate                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow 1: Spec-First Review (Simple)

For users with an existing OpenAPI spec who want to check AIP compliance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SPEC-FIRST REVIEW FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

User                    Claude Code                    MCP Server
  │                          │                              │
  │  /baume-review spec.yaml │                              │
  │─────────────────────────>│                              │
  │                          │                              │
  │                          │  baume-review(specPath)      │
  │                          │─────────────────────────────>│
  │                          │                              │
  │                          │                    ┌─────────┴─────────┐
  │                          │                    │ Worker Thread     │
  │                          │                    │ - Parse spec      │
  │                          │                    │ - Run AIP rules   │
  │                          │                    │ - Generate fixes  │
  │                          │                    └─────────┬─────────┘
  │                          │                              │
  │                          │  { reviewId, findings }      │
  │                          │<─────────────────────────────│
  │                          │                              │
  │                          │  (writes review document)    │
  │                          │─────────────────────────────>│
  │                          │     .baume/reviews/          │
  │                          │                              │
  │  Review summary +        │                              │
  │  findings document       │                              │
  │<─────────────────────────│                              │
  │                          │                              │

Output: .baume/reviews/YYYY-MM-DD-{spec-name}-review.md
```

---

## Flow 2: Code-First with Correlation (Full)

For users with code-generated OpenAPI specs (NestJS, Fastify, Express).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CODE-FIRST WITH CORRELATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

User                    Claude Code                         MCP Server
  │                          │                                   │
  │  /baume-discover         │                                   │
  │─────────────────────────>│                                   │
  │                          │  (searches for openapi.yaml,      │
  │                          │   swagger.json, etc.)             │
  │                          │                                   │
  │  Found: openapi.yaml     │                                   │
  │<─────────────────────────│                                   │
  │                          │                                   │
  │  /baume-review           │                                   │
  │─────────────────────────>│                                   │
  │                          │  baume-review(specPath)           │
  │                          │──────────────────────────────────>│
  │                          │                                   │
  │                          │  { reviewId, findings }           │
  │                          │<──────────────────────────────────│
  │                          │                                   │
  │  /baume-plan             │                                   │
  │─────────────────────────>│                                   │
  │                          │                                   │
  │                          │  ┌─────────────────────────────┐  │
  │                          │  │ baume-code-correlator skill │  │
  │                          │  │                             │  │
  │                          │  │  1. Load findings           │  │
  │                          │  │  2. Detect framework        │  │
  │                          │  │  3. Extract operations      │  │
  │                          │  │  4. Spawn locator agents    │  │
  │                          │  └──────────┬──────────────────┘  │
  │                          │             │                     │
  │                          │     ┌───────┴───────┐             │
  │                          │     ▼               ▼             │
  │                          │  ┌──────┐       ┌──────┐          │
  │                          │  │Agent │       │Agent │ ...      │
  │                          │  │ GET  │       │ POST │          │
  │                          │  │/users│       │/users│          │
  │                          │  └──┬───┘       └──┬───┘          │
  │                          │     │              │               │
  │                          │     │  Grep, Glob, Read           │
  │                          │     │              │               │
  │                          │     ▼              ▼               │
  │                          │  CodeLocation[] collected         │
  │                          │                                   │
  │                          │  (writes correlation JSON)        │
  │                          │  .baume/correlations/             │
  │                          │                                   │
  │                          │  (generates plan with diffs)      │
  │                          │  .baume/plans/                    │
  │                          │                                   │
  │  Plan with code          │                                   │
  │  locations + diffs       │                                   │
  │<─────────────────────────│                                   │
  │                          │                                   │

Output:
  - .baume/correlations/YYYY-MM-DD-{spec-name}.json
  - .baume/plans/YYYY-MM-DD-{spec-name}-plan.md
```

---

## Flow 3: Apply Fixes

For applying the suggested fixes from a plan.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLY FIXES FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User                    Claude Code                         MCP Server
  │                          │                                   │
  │  /baume-fix {plan-path}  │                                   │
  │─────────────────────────>│                                   │
  │                          │                                   │
  │                          │  (reads plan document)            │
  │                          │                                   │
  │                          │  For each phase:                  │
  │                          │  ┌─────────────────────────────┐  │
  │                          │  │ Phase 1: Quick Wins         │  │
  │                          │  │                             │  │
  │                          │  │ For each task:              │  │
  │                          │  │  - Apply spec diff (MCP)    │──┼─> baume-apply-fixes
  │                          │  │  - Apply code diff (Edit)   │  │
  │                          │  │  - Mark task complete       │  │
  │                          │  │                             │  │
  │                          │  │ Ask: Continue to Phase 2?   │  │
  │                          │  └─────────────────────────────┘  │
  │                          │                                   │
  │  Confirm continue        │                                   │
  │─────────────────────────>│                                   │
  │                          │                                   │
  │                          │  ┌─────────────────────────────┐  │
  │                          │  │ Phase 2: Pagination         │  │
  │                          │  │ ...                         │  │
  │                          │  └─────────────────────────────┘  │
  │                          │                                   │
  │  Fixes applied,          │                                   │
  │  plan updated            │                                   │
  │<─────────────────────────│                                   │
  │                          │                                   │
```

---

## Flow 4: Validate Fixes

For verifying that fixes were applied correctly.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VALIDATE FIXES FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User                    Claude Code                         MCP Server
  │                          │                                   │
  │  /baume-validate         │                                   │
  │    {plan-path}           │                                   │
  │─────────────────────────>│                                   │
  │                          │                                   │
  │                          │  (reads plan, gets spec path)     │
  │                          │                                   │
  │                          │  baume-review(specPath)           │
  │                          │──────────────────────────────────>│
  │                          │                                   │
  │                          │  { new findings }                 │
  │                          │<──────────────────────────────────│
  │                          │                                   │
  │                          │  Compare:                         │
  │                          │  - Original findings              │
  │                          │  - New findings                   │
  │                          │                                   │
  │                          │  Update plan:                     │
  │                          │  - Mark resolved issues ✓         │
  │                          │  - Flag remaining issues          │
  │                          │  - Note new issues (regressions)  │
  │                          │                                   │
  │  Validation report       │                                   │
  │<─────────────────────────│                                   │
  │                          │                                   │
```

---

## Code Correlation Detail

How the `baume-code-correlator` skill works internally:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CODE CORRELATION DETAIL                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    baume-code-correlator skill
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Input   │          │ Input   │          │ Input   │
   │ Sources │          │ Sources │          │ Sources │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ MCP cached    │   │ Review doc    │   │ Inline        │
│ findings      │   │ (markdown)    │   │ findings      │
│ via reviewId  │   │               │   │ (from caller) │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │ 1. Parse findings       │
              │ 2. Extract operations   │
              │    GET /users/{id}      │
              │    POST /users          │
              │    ...                  │
              │ 3. Dedupe by method+path│
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ 4. Detect framework     │
              │    from package.json    │
              │    - @nestjs/core       │
              │    - fastify            │
              │    - express            │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ 5. Spawn agents         │
              │    (up to 5 parallel)   │
              └───────────┬─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ baume-code-   │ │ baume-code-   │ │ baume-code-   │
│ locator       │ │ locator       │ │ locator       │
│               │ │               │ │               │
│ GET /users/id │ │ POST /users   │ │ GET /orders   │
│               │ │               │ │               │
│ Tools:        │ │ Tools:        │ │ Tools:        │
│ - Grep        │ │ - Grep        │ │ - Grep        │
│ - Glob        │ │ - Glob        │ │ - Glob        │
│ - Read        │ │ - Read        │ │ - Read        │
│ - LS          │ │ - LS          │ │ - LS          │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ CodeLocation  │ │ CodeLocation  │ │ CodeLocation  │
│ file:line     │ │ file:line     │ │ file:line     │
│ confidence    │ │ confidence    │ │ confidence    │
│ snippet       │ │ snippet       │ │ snippet       │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ 6. Compile results      │
              │    ExtendedFinding[]    │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ 7. Generate diffs       │
              │    (from diff-templates)│
              │    - spec diffs         │
              │    - code diffs         │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ 8. Output               │
              │    correlation.json     │
              └─────────────────────────┘
```

---

## Future: Public MCP Server Flow

When MCP sampling + SDK fallback is implemented:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FUTURE: PUBLIC MCP SERVER FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

Any MCP Client              Public MCP Server              Claude SDK
(VS Code, custom)                  │                       (fallback)
      │                            │                            │
      │  baume-review(specUrl)     │                            │
      │───────────────────────────>│                            │
      │                            │                            │
      │  { reviewId, findings }    │                            │
      │<───────────────────────────│                            │
      │                            │                            │
      │  baume-correlate(          │                            │
      │    reviewId,               │                            │
      │    projectRoot,            │                            │
      │    apiKey?)                │                            │
      │───────────────────────────>│                            │
      │                            │                            │
      │                            │  Check: client supports    │
      │                            │  sampling?                 │
      │                            │                            │
      │                     ┌──────┴──────┐                     │
      │                     │             │                     │
      │                     ▼             ▼                     │
      │              ┌───────────┐ ┌───────────┐                │
      │              │ STDIO +   │ │ HTTP or   │                │
      │              │ sampling  │ │ no sample │                │
      │              │ supported │ │ support   │                │
      │              └─────┬─────┘ └─────┬─────┘                │
      │                    │             │                      │
      │                    ▼             ▼                      │
      │              ┌───────────┐ ┌───────────┐                │
      │              │ Use MCP   │ │ Fallback  │                │
      │              │ sampling  │ │ to SDK    │───────────────>│
      │              │           │ │           │                │
      │              └─────┬─────┘ └─────┬─────┘                │
      │                    │             │                      │
      │                    └──────┬──────┘                      │
      │                           │                             │
      │  { ExtendedFinding[] }    │                             │
      │<──────────────────────────│                             │
      │                           │                             │

API Key Priority:
  1. Tool input (apiKey parameter)
  2. HTTP header (X-Anthropic-Key)
  3. Environment variable (ANTHROPIC_API_KEY)
```

---

## File Locations Summary

```
.baume/
├── discovery/
│   └── YYYY-MM-DD-discovery.md       # /baume-discover output
├── reviews/
│   └── YYYY-MM-DD-{spec}-review.md   # /baume-review output
├── correlations/
│   └── YYYY-MM-DD-{spec}.json        # Code correlation data
└── plans/
    └── YYYY-MM-DD-{spec}-plan.md     # /baume-plan output

plugins/baume/
├── commands/
│   ├── baume-discover.md
│   ├── baume-review.md
│   ├── baume-plan.md
│   ├── baume-fix.md
│   └── baume-validate.md
├── agents/
│   └── baume-code-locator.md               # Finds code for single operation
├── skills/
│   ├── aip-knowledge/                      # AIP reference material
│   └── baume-code-correlator/              # Orchestrates code correlation
│       ├── SKILL.md
│       └── diff-templates.md
└── mcp-server/
    └── src/
        ├── tools/
        │   ├── review.ts                 # baume-review tool
        │   ├── apply-fixes.ts            # baume-apply-fixes tool
        │   ├── list-rules.ts             # baume-list-rules tool
        │   ├── get-info.ts               # baume-get-info tool
        │   └── correlate.ts              # baume-correlate (future)
        └── types/
            └── extended-finding.ts       # Shared type definitions
```

---

## Quick Reference: Which Tool When?

| User Goal                           | Command/Tool                          | Output                           |
| ----------------------------------- | ------------------------------------- | -------------------------------- |
| Find OpenAPI specs in codebase      | `/baume-discover`                     | Discovery document               |
| Check spec against AIP rules        | `/baume-review` or `baume-review` MCP | Review findings                  |
| Create fix plan with code locations | `/baume-plan`                         | Plan document + correlation JSON |
| Apply suggested fixes               | `/baume-fix`                          | Modified spec + code             |
| Verify fixes worked                 | `/baume-validate`                     | Updated plan with status         |
| Understand an AIP rule              | `baume-get-info` MCP                  | AIP summary                      |
| List available rules                | `baume-list-rules` MCP                | Rule list                        |
| Find code for one endpoint          | `baume-code-locator` agent            | CodeLocation[]                   |
