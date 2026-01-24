# AIP OpenAPI Reviewer MCP Server

MCP server exposing AIP OpenAPI reviewer as tools for AI agents (Claude Code, Claude Desktop, etc.).

## Quick Start

```bash
# Build
npm run build

# Run HTTP server (port 4000)
npm run start

# Run STDIO server (for Claude Desktop)
npm run start:stdio
```

## Transports

### HTTP (Streamable HTTP)

```bash
npm run start
# Server at http://localhost:4000
# MCP endpoint: POST /mcp
# Health check: GET /health
```

Supports stateful sessions via `mcp-session-id` header.

### STDIO

```bash
npm run start:stdio
# Or via the bin entry:
npx aip-mcp-server
```

For Claude Desktop, add to config:

```json
{
  "mcpServers": {
    "aip-reviewer": {
      "args": ["/path/to/dist/stdio.js"],
      "command": "node"
    }
  }
}
```

## Tools

| Tool              | Description                            |
| ----------------- | -------------------------------------- |
| `aip-review`      | Analyze OpenAPI spec against AIP rules |
| `aip-apply-fixes` | Apply suggested fixes to a spec        |
| `aip-list-rules`  | List available AIP rules               |
| `aip-get-info`    | Get information about a specific AIP   |
| `aip-correlate`   | Correlate findings with code locations |

### aip-review

```json
{
  "arguments": {
    "categories": ["naming", "pagination"],
    "skipRules": ["aip122/plural-resources"],
    "specPath": "/path/to/openapi.yaml"
  },
  "name": "aip-review"
}
```

Parameters:

- `specPath` (string): Local file path to OpenAPI spec
- `specUrl` (string): URL to fetch OpenAPI spec from
- `categories` (string[]): Filter by categories (naming, pagination, errors, etc.)
- `skipRules` (string[]): Skip specific rule IDs
- `strict` (boolean): Treat warnings as errors

### aip-apply-fixes

```json
{
  "name": "aip-apply-fixes",
  "arguments": {
    "specPath": "/path/to/openapi.yaml",
    "findings": [...],
    "writeBack": true
  }
}
```

Parameters:

- `specPath` / `specUrl`: Source spec location
- `findings`: Array of findings from `aip-review` (only those with `fix` property are applied)
- `writeBack` (boolean): Write modified spec back to `specPath`
- `dryRun` (boolean): Validate without modifying

Returns a signed URL (valid 5 minutes) to download the modified spec.

### aip-correlate

```json
{
  "arguments": {
    "correlationLevel": "moderate",
    "framework": "nestjs",
    "projectRoot": "/path/to/project",
    "reviewId": "abc123"
  },
  "name": "aip-correlate"
}
```

Parameters:

- `reviewId` (string): Review ID from a previous `aip-review` call
- `projectRoot` (string): Root directory of the project to search for code
- `specPath` (string): Path to OpenAPI spec (optional, for context extraction)
- `framework` (string): Framework hint - "nestjs", "fastify", "express", or "unknown"
- `correlationLevel` (string): How aggressively to correlate - "minimal", "moderate", or "thorough"

Returns ExtendedFinding[] with file:line references for each API endpoint.

## Prompts

The server exposes prompt templates that can be invoked through MCP clients.

### aip-code-locator

Find the code file and line number where an API operation is implemented.

**Arguments:**

| Name        | Type                                            | Required | Description                        |
| ----------- | ----------------------------------------------- | -------- | ---------------------------------- |
| method      | string                                          | Yes      | HTTP method (GET, POST, PUT, etc.) |
| path        | string                                          | Yes      | API path (e.g., /users/{id})       |
| projectRoot | string                                          | Yes      | Root directory to search           |
| framework   | "nestjs" \| "fastify" \| "express" \| "unknown" | No       | Web framework (default: "unknown") |
| operationId | string                                          | No       | OpenAPI operationId hint           |

**Example:**

```typescript
const result = await client.getPrompt({
  name: 'aip-code-locator',
  arguments: {
    method: 'GET',
    path: '/users/{id}',
    framework: 'nestjs',
    projectRoot: '/path/to/project',
  },
});
// Returns prompt messages for finding the implementation
```

**Output:**

Returns a user role message containing a detailed search strategy and instructions for locating the API endpoint implementation in the codebase.

### aip-lookup

Get detailed information about a specific AIP for understanding rule context.

**Arguments:**

| Name    | Type   | Required | Description                               |
| ------- | ------ | -------- | ----------------------------------------- |
| aip     | string | Yes      | AIP number (e.g., "158", "193")           |
| context | string | No       | Context about why you need this AIP       |
| finding | string | No       | Specific finding to explain with this AIP |

**Example:**

```typescript
const result = await client.getPrompt({
  name: 'aip-lookup',
  arguments: {
    aip: '158',
    context: 'User wants to understand pagination requirements',
  },
});
// Returns prompt messages for explaining AIP-158
```

## Resources

The server exposes resources via the MCP resources protocol. Resources are cached artifacts from tools that can be accessed later.

### Resource Templates

| URI Pattern                    | Name                   | Description                                                                   | MIME Type                                  |
| ------------------------------ | ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| `aip://findings?id={reviewId}` | AIP Review Findings    | Cached review findings by reviewId (may include code locations if correlated) | `application/json`                         |
| `aip://specs?id={specId}`      | Modified OpenAPI Specs | Modified OpenAPI specs after applying fixes                                   | `application/x-yaml` or `application/json` |

### Accessing Resources

Resources are automatically created when using tools:

1. **After `aip-review`**: Review findings are stored and accessible via `aip://findings?id={reviewId}`
2. **After `aip-apply-fixes`**: Modified specs are stored and accessible via `aip://specs?id={specId}`

**Example workflow:**

```typescript
// 1. Run review
const reviewResult = await client.callTool('aip-review', {
  specPath: '/path/to/openapi.yaml',
});
// reviewResult.reviewId = "abc123"

// 2. Access findings resource
const findings = await client.readResource('aip://findings?id=abc123');
// Returns full findings JSON

// 3. Apply fixes
const fixResult = await client.callTool('aip-apply-fixes', {
  reviewId: 'abc123',
  specPath: '/path/to/openapi.yaml',
});
// fixResult.specId = "xyz789"

// 4. Access modified spec
const modifiedSpec = await client.readResource('aip://specs?id=xyz789');
// Returns modified OpenAPI spec
```

### Resource Lifecycle

- **HTTP transport**: Resources are stored in SQLite and expire based on configuration
- **STDIO transport**: Resources are stored in-memory with filesystem fallback
- Resources are automatically cleaned up after expiration

## Architecture

### Worker Pool

Both HTTP and STDIO transports use a worker pool for CPU-intensive operations (spec parsing, review execution). This prevents blocking the main event loop.

```
Main Thread                              Worker Thread
============                              =============

1. HTTP fetch / file read
   │
2. ArrayBuffer (raw bytes)
   │
3. Copy to SharedArrayBuffer ─────────→ 4. Receive SAB reference (zero-copy)
   │                                        │
   │                                     5. TextDecoder.decode()
   │                                        │
   │                                     6. JSON.parse() / YAML.parse()
   │                                        │
   │                                     7. OpenAPIReviewer.review()
   │                                        │
   │                                     8. formatJSON(findings)
   │                                        │
9. Receive result ←────────────────────  postMessage(result)
   │
10. Return to client
```

**Key design decisions:**

1. **SharedArrayBuffer for zero-copy transfer**: Specs can be megabytes. Instead of serializing twice (JSON.stringify for postMessage, then parse in worker), we transfer raw bytes via SharedArrayBuffer.

2. **Parsing in worker thread**: All CPU-intensive work (TextDecoder, JSON/YAML parsing, rule execution) happens in the worker. Main thread only does I/O.

3. **Pool sizing**: Defaults to `availableParallelism() - 1` workers (leaves one core for main thread).

4. **No inline spec support**: Removed to avoid double-serialization. Use `specPath` or `specUrl` instead.

### Health Endpoint

```bash
curl http://localhost:4000/health
```

```json
{
  "sessions": 0,
  "status": "ok",
  "tempStorage": {
    "count": 0,
    "type": "sqlite+local-fs"
  },
  "version": "1.0.0",
  "workerPool": {
    "available": 11,
    "busy": 0,
    "queued": 0,
    "total": 11
  }
}
```

### Temp Storage

Modified specs are stored temporarily and served via signed URLs:

- **HTTP transport**: SQLite (multi-process safe)
- **STDIO transport**: In-memory with filesystem fallback

URLs expire after 5 minutes.

## Development

```bash
# Watch mode (rebuilds on change)
npm run dev        # HTTP server
npm run dev:stdio  # STDIO server

# Type check
npm run typecheck

# Lint
npm run lint
```

### Project Structure

```
src/
├── index.ts           # HTTP entry point
├── stdio.ts           # STDIO entry point
├── server.ts          # Fastify HTTP server setup
├── mcp.ts             # MCP server factory
├── tools/
│   ├── index.ts       # Tool registration
│   ├── types.ts       # ToolContext interface
│   ├── review.ts      # aip-review tool
│   ├── apply-fixes.ts # aip-apply-fixes tool
│   ├── list-rules.ts  # aip-list-rules tool
│   ├── get-info.ts    # aip-get-info tool
│   ├── spec-loader.ts # Load specs as raw buffers
│   ├── worker-pool.ts # Worker pool manager
│   └── worker.ts      # Worker thread implementation
├── plugins/
│   ├── security.ts    # CORS, security headers
│   └── rate-limit.ts  # Request rate limiting
└── services/
    └── temp-storage.ts # Temporary spec storage
```

## Environment Variables

| Variable    | Default | Description                              |
| ----------- | ------- | ---------------------------------------- |
| `PORT`      | 4000    | HTTP server port                         |
| `HOST`      | 0.0.0.0 | HTTP server host                         |
| `LOG_LEVEL` | info    | Logging level (debug, info, warn, error) |

## License

MIT
