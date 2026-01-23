# Plan: Port Custom Resource Handlers to @platformatic/mcp

This document provides a step-by-step plan for porting the patch from this project to a forked @platformatic/mcp repository, preparing it for a PR to upstream.

---

## Motivation & Reasoning

### The Problem

The current @platformatic/mcp implementation has limited resource handling:

1. **`resources/list` is static** - Returns resources from an in-memory Map populated at startup. No way to enumerate resources dynamically from a database, cache, or external service.

2. **`resources/read` uses exact URI matching only** - If you register `aip://findings` with a `uriSchema` for query parameters, reading `aip://findings?id=abc123` fails because the Map lookup is literal. There's no fallback to match base URIs with query parameter schemas.

3. **No subscription support** - The MCP spec includes `resources/subscribe` and `resources/unsubscribe` for clients to receive notifications when resources change. Not implemented.

### Why This Matters

Consider an MCP server that stores review findings and wants clients to subscribe for updates:

```typescript
// Current limitation: No way to handle subscriptions
// Client calls resources/subscribe -> METHOD_NOT_FOUND

// With the patch:
// Application creates its own subscription store
const subscriptionStore = createSubscriptionStore();

// Set custom handlers that use the store
app.mcpSetResourcesSubscribeHandler(async (params, ctx) => {
  await subscriptionStore.subscribe(ctx.sessionId, params.uri);
  return {};
});

// When resources change, application notifies subscribers
const subscribers = await subscriptionStore.getSubscribers(changedUri);
for (const sessionId of subscribers) {
  await app.mcpSendToSession(sessionId, {
    jsonrpc: '2.0',
    method: 'notifications/resources/updated',
    params: { uri: changedUri },
  });
}
```

For dynamic resource URIs with query parameters:

```typescript
// Register a resource with uriSchema for query param validation
app.mcpAddResource(
  {
    uri: 'aip://findings',
    name: 'Findings',
    uriSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  async (uri, params) => {
    // params.id contains the query parameter value
    const finding = await db.getFinding(params.id);
    return {
      contents: [
        { uri, text: JSON.stringify(finding), mimeType: 'application/json' },
      ],
    };
  }
);

// Now reading 'aip://findings?id=abc' works:
// 1. Exact match for 'aip://findings?id=abc' fails
// 2. URI contains '?', so try base URI 'aip://findings'
// 3. Base resource has uriSchema, so use it
// 4. Query params validated against uriSchema, handler called
```

### Design Decisions

**1. Custom subscription handlers (not built-in tracking)**

Rather than embedding subscription logic in @platformatic/mcp, we use custom handlers that delegate to application-managed subscription stores:

```typescript
// Application creates its own subscription store (memory/redis)
const subscriptionStore = createSubscriptionStore({ redis });

// Set custom handlers that use the store
app.mcpSetResourcesSubscribeHandler(async (params, ctx) => {
  await subscriptionStore.subscribe(ctx.sessionId, params.uri);
  return {};
});

app.mcpSetResourcesUnsubscribeHandler(async (params, ctx) => {
  await subscriptionStore.unsubscribe(ctx.sessionId, params.uri);
  return {};
});
```

This approach:

- Follows platformatic's pattern of delegating logic to applications
- Supports both memory and Redis-backed stores
- Allows TTL-based automatic cleanup
- Keeps @platformatic/mcp lightweight

**2. Handler storage via dependency injection**

Handlers are stored in a `resourceHandlers` object created in the main plugin and passed through the dependency chain:

```typescript
// In index.ts
const resourceHandlers = {
  subscribe: null,
  unsubscribe: null
};

// Passed to metaDecorators (for setter decorators)
app.register(metaDecorators, { tools, resources, prompts, resourceHandlers });

// Passed to routes (for handler invocation)
app.register(mcpRoutes, { ..., resourceHandlers });
```

This avoids module-level state and follows Fastify's plugin encapsulation patterns.

**3. METHOD_NOT_FOUND when no handler configured**

When `resources/subscribe` or `resources/unsubscribe` is called without a custom handler set, the server returns a JSON-RPC `METHOD_NOT_FOUND` error:

```json
{
  "error": {
    "code": -32601,
    "message": "resources/subscribe handler not configured"
  },
  "id": 1,
  "jsonrpc": "2.0"
}
```

This is intentional: subscriptions require application-side storage, so there's no sensible default behavior. Returning an error makes it clear the feature isn't enabled.

**4. Query parameter URI matching uses `uriSchema` as indicator**

When exact URI match fails:

1. Check if URI contains `?`
2. If yes, extract base URI (before `?`)
3. Look up base URI in resources map
4. Only use base resource if it has `uriSchema` defined

The `uriSchema` acts as a signal that the resource expects query parameters. Without it, the fallback doesn't apply - this prevents accidentally matching unrelated resources.

### MCP Spec Compliance

The patch implements these MCP specification methods:

| Method                     | Spec Status | Implementation                        |
| -------------------------- | ----------- | ------------------------------------- |
| `resources/list`           | Required    | Default (no custom handler in patch)  |
| `resources/read`           | Required    | ✅ Enhanced with query param fallback |
| `resources/templates/list` | Optional    | ❌ Not implemented                    |
| `resources/subscribe`      | Optional    | ✅ Custom handler pattern             |
| `resources/unsubscribe`    | Optional    | ✅ Custom handler pattern             |

### Backward Compatibility

The patch maintains full backward compatibility:

- All existing `mcpAddResource` registrations continue to work
- Default `resources/read` behavior unchanged for exact matches
- Query param fallback only activates when exact match fails AND resource has `uriSchema`
- Subscribe/unsubscribe return errors (not silent success) when not configured

---

## Prerequisites

1. Fork https://github.com/platformatic/mcp to your GitHub account
2. Clone the fork locally
3. Have this project available for reference: `claude-aip-plugins/plugins/aip-api-design/mcp-server`

## Reference Files

The patch file contains all the changes needed:

```
plugins/aip-api-design/mcp-server/patches/@platformatic+mcp+1.2.2.patch
```

Key source files in this project for reference:

- `src/types/mcp-context.ts` - TypeScript type definitions for handlers
- `src/resources/register.ts` - Example usage of the new API
- `src/resources/resources.e2e-test.ts` - E2E tests covering all resource methods
- `src/services/subscription-store/` - Subscription store implementations (Memory/Redis)

---

## Step 1: Set Up the Fork

```bash
# Clone your fork
git clone git@github.com:<your-username>/mcp.git
cd mcp

# Add upstream remote
git remote add upstream https://github.com/platformatic/mcp.git

# Create feature branch
git checkout -b feat/resource-subscriptions

# Install dependencies
npm install
```

---

## Step 2: Understand the Codebase Structure

The @platformatic/mcp TypeScript source is in `src/`:

```
src/
├── handlers.ts          # Core MCP request handlers (MODIFY)
├── decorators/
│   └── meta.ts          # Fastify decorators (MODIFY)
├── types.ts             # Type definitions (MODIFY)
├── validation/
│   └── index.ts         # Schema validation
├── schema.ts            # JSON-RPC constants
├── security.ts          # Security utilities
├── routes/
│   └── mcp.ts           # Route definitions (MODIFY)
└── index.ts             # Main plugin entry (MODIFY)
```

---

## Step 3: Modify `src/handlers.ts`

### 3.1 Add Subscription Handlers

Add these functions after the existing `handleResourcesRead` function:

```typescript
async function handleResourcesSubscribe(
  request: JsonRpcRequest,
  sessionId: string | undefined,
  dependencies: HandlerDependencies
): Promise<JsonRpcResponse> {
  const { resourceHandlers } = dependencies;

  // Use custom handler if set
  if (resourceHandlers?.subscribe) {
    try {
      const result = await resourceHandlers.subscribe(request.params, {
        sessionId,
        request: dependencies.request,
        reply: dependencies.reply,
        authContext: dependencies.authContext,
      });
      return createResponse(request.id, result);
    } catch (error) {
      return createError(
        request.id,
        INTERNAL_ERROR,
        `Resource subscribe failed: ${(error as Error).message || error}`
      );
    }
  }

  // No custom handler - return method not found
  return createError(
    request.id,
    METHOD_NOT_FOUND,
    'resources/subscribe handler not configured'
  );
}

async function handleResourcesUnsubscribe(
  request: JsonRpcRequest,
  sessionId: string | undefined,
  dependencies: HandlerDependencies
): Promise<JsonRpcResponse> {
  const { resourceHandlers } = dependencies;

  // Use custom handler if set
  if (resourceHandlers?.unsubscribe) {
    try {
      const result = await resourceHandlers.unsubscribe(request.params, {
        sessionId,
        request: dependencies.request,
        reply: dependencies.reply,
        authContext: dependencies.authContext,
      });
      return createResponse(request.id, result);
    } catch (error) {
      return createError(
        request.id,
        INTERNAL_ERROR,
        `Resource unsubscribe failed: ${(error as Error).message || error}`
      );
    }
  }

  // No custom handler - return method not found
  return createError(
    request.id,
    METHOD_NOT_FOUND,
    'resources/unsubscribe handler not configured'
  );
}
```

### 3.2 Modify `handleResourcesRead` for Query Param Fallback

In the existing `handleResourcesRead` function, replace the exact match lookup:

```typescript
// Before:
const resource = resources.get(uri);

// After:
// Try exact match first
let resource = resources.get(uri);

// If not found and URI has query params, try base URI (for uriSchema pattern matching)
if (!resource && uri.includes('?')) {
  const baseUri = uri.split('?')[0];
  const baseResource = resources.get(baseUri);
  // Only use base resource if it has uriSchema (expects query params)
  if (baseResource?.definition?.uriSchema) {
    resource = baseResource;
  }
}
```

### 3.3 Update `handleRequest` Switch Statement

Add cases for the new methods:

```typescript
case 'resources/read':
  return await handleResourcesRead(request, sessionId, dependencies);
case 'resources/subscribe':
  return await handleResourcesSubscribe(request, sessionId, dependencies);
case 'resources/unsubscribe':
  return await handleResourcesUnsubscribe(request, sessionId, dependencies);
```

### 3.4 Update `HandlerDependencies` Type

Add `resourceHandlers` to the dependencies interface:

```typescript
interface HandlerDependencies {
  // ... existing fields
  resourceHandlers?: {
    subscribe: ResourceSubscribeHandler | null;
    unsubscribe: ResourceUnsubscribeHandler | null;
  };
}
```

---

## Step 4: Modify `src/decorators/meta.ts`

### 4.1 Update Plugin Options

```typescript
const mcpDecoratorsPlugin = async (app, options) => {
  const { tools, resources, prompts, resourceHandlers } = options;
  // ... existing code
```

### 4.2 Add Decorator Functions

Add after the existing `mcpAddPrompt` decorator:

```typescript
// Resource subscription handler setters
app.decorate(
  'mcpSetResourcesSubscribeHandler',
  (handler: ResourceSubscribeHandler) => {
    resourceHandlers.subscribe = handler;
  }
);

app.decorate(
  'mcpSetResourcesUnsubscribeHandler',
  (handler: ResourceUnsubscribeHandler) => {
    resourceHandlers.unsubscribe = handler;
  }
);
```

---

## Step 5: Add Type Definitions in `src/types.ts`

```typescript
/**
 * Context passed to custom resource subscription handlers.
 */
export interface ResourceHandlerContext {
  sessionId?: string;
  request: FastifyRequest;
  reply: FastifyReply;
  authContext?: AuthorizationContext;
}

/**
 * Parameters for resources/subscribe.
 */
export interface ResourceSubscribeParams {
  uri: string;
}

/**
 * Parameters for resources/unsubscribe.
 */
export interface ResourceUnsubscribeParams {
  uri: string;
}

/**
 * Custom handler for resources/subscribe.
 */
export type ResourceSubscribeHandler = (
  params: ResourceSubscribeParams,
  context: ResourceHandlerContext
) => Promise<Record<string, unknown>>;

/**
 * Custom handler for resources/unsubscribe.
 */
export type ResourceUnsubscribeHandler = (
  params: ResourceUnsubscribeParams,
  context: ResourceHandlerContext
) => Promise<Record<string, unknown>>;

/**
 * Container for custom resource handlers.
 */
export interface ResourceHandlers {
  subscribe: ResourceSubscribeHandler | null;
  unsubscribe: ResourceUnsubscribeHandler | null;
}
```

### 5.1 Add Fastify Declaration Merging

```typescript
declare module 'fastify' {
  interface FastifyInstance {
    // Existing decorators...

    // Resource subscription handler setters
    mcpSetResourcesSubscribeHandler(handler: ResourceSubscribeHandler): void;
    mcpSetResourcesUnsubscribeHandler(
      handler: ResourceUnsubscribeHandler
    ): void;
  }
}
```

---

## Step 6: Modify `src/index.ts`

### 6.1 Create resourceHandlers Object

After the existing Maps are created:

```typescript
const tools = new Map();
const resources = new Map();
const prompts = new Map();

// Custom resource handlers for subscribe/unsubscribe
const resourceHandlers: ResourceHandlers = {
  subscribe: null,
  unsubscribe: null,
};
```

### 6.2 Pass to metaDecorators

```typescript
app.register(metaDecorators, {
  tools,
  resources,
  prompts,
  resourceHandlers, // Add this
});
```

### 6.3 Pass to Routes

```typescript
app.register(mcpRoutes, {
  // ... existing options
  tools,
  resources,
  prompts,
  resourceHandlers, // Add this
  sessionStore,
  messageBroker,
  localStreams,
});
```

---

## Step 7: Modify `src/routes/mcp.ts`

### 7.1 Update Options Destructuring

```typescript
const mcpPubSubRoutesPlugin = async (app, options) => {
  const {
    enableSSE,
    opts,
    capabilities,
    serverInfo,
    tools,
    resources,
    prompts,
    resourceHandlers,  // Add this
    sessionStore,
    messageBroker,
    localStreams
  } = options;
```

### 7.2 Pass to Handler Dependencies

In the route handler where dependencies are constructed:

```typescript
const dependencies = {
  tools,
  resources,
  prompts,
  resourceHandlers, // Add this
  request,
  reply,
  authContext,
};
```

---

## Step 8: Add Tests

Create `tests/resources-subscriptions.test.ts`:

```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert';
// ... test subscription handlers
```

Reference tests from:

- `claude-aip-plugins/plugins/aip-api-design/mcp-server/src/resources/resources.e2e-test.ts`

Key test scenarios:

1. Subscribe without handler returns METHOD_NOT_FOUND
2. Unsubscribe without handler returns METHOD_NOT_FOUND
3. Custom subscribe handler called with correct params and context
4. Custom unsubscribe handler called with correct params and context
5. Handler errors return INTERNAL_ERROR with message
6. Query param URI matching works when resource has uriSchema
7. Query param URI matching doesn't match without uriSchema

---

## Step 9: Update Documentation

### 9.1 Update README.md

Add section on resource subscriptions:

````markdown
## Resource Subscriptions

The MCP spec supports `resources/subscribe` and `resources/unsubscribe` for clients to receive
notifications when resources change. To enable this, set custom handlers:

```typescript
// Track subscriptions (use your own storage - memory, Redis, etc.)
const subscriptions = new Map<string, Set<string>>();

app.mcpSetResourcesSubscribeHandler(async (params, context) => {
  const { uri } = params;
  const { sessionId } = context;

  if (!subscriptions.has(uri)) {
    subscriptions.set(uri, new Set());
  }
  subscriptions.get(uri)!.add(sessionId!);

  return {};
});

app.mcpSetResourcesUnsubscribeHandler(async (params, context) => {
  const { uri } = params;
  const { sessionId } = context;

  subscriptions.get(uri)?.delete(sessionId!);

  return {};
});

// When a resource changes, notify subscribers
async function notifyResourceChange(uri: string) {
  const subscribers = subscriptions.get(uri);
  if (!subscribers) return;

  for (const sessionId of subscribers) {
    await app.mcpSendToSession(sessionId, {
      jsonrpc: '2.0',
      method: 'notifications/resources/updated',
      params: { uri },
    });
  }
}
```
````

Without custom handlers, `resources/subscribe` and `resources/unsubscribe` return
`METHOD_NOT_FOUND` errors.

````

---

## Step 10: Build and Test

```bash
# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
````

---

## Step 11: Create PR

```bash
# Commit changes
git add -A
git commit -m "feat: add resource subscription handlers and query param URI matching

- Add mcpSetResourcesSubscribeHandler decorator
- Add mcpSetResourcesUnsubscribeHandler decorator
- Add resources/subscribe handler (returns METHOD_NOT_FOUND if not configured)
- Add resources/unsubscribe handler (returns METHOD_NOT_FOUND if not configured)
- Add query param URI fallback in resources/read (uses uriSchema as indicator)
- Pass resourceHandlers through plugin dependency chain

This enables applications to:
- Track resource subscriptions per session using their own storage
- Send targeted notifications to subscribed clients
- Use query parameters with registered resources that have uriSchema"

# Push to fork
git push origin feat/resource-subscriptions

# Create PR via GitHub UI or CLI
gh pr create --title "feat: add resource subscription handlers" \
  --body "## Summary

Adds support for MCP resource subscriptions via custom handlers:

- **Subscribe/unsubscribe handlers**: Applications set custom handlers to track subscriptions
- **Query param URI matching**: resources/read falls back to base URI when resource has uriSchema

## API

\`\`\`typescript
// Set subscription handlers
app.mcpSetResourcesSubscribeHandler(async (params, ctx) => {
  await myStore.subscribe(ctx.sessionId, params.uri);
  return {};
});

app.mcpSetResourcesUnsubscribeHandler(async (params, ctx) => {
  await myStore.unsubscribe(ctx.sessionId, params.uri);
  return {};
});
\`\`\`

## Design Decisions

1. **Custom handlers, not built-in tracking**: Applications manage their own subscription storage
2. **METHOD_NOT_FOUND when not configured**: Clear signal that feature isn't enabled
3. **Dependency injection for handlers**: Uses resourceHandlers object passed through plugin chain
4. **uriSchema as query param indicator**: Only falls back to base URI if resource expects params

## Backward Compatibility

- Existing resources/read behavior unchanged for exact matches
- Subscribe/unsubscribe return errors (not silent success) when not configured
- No changes to existing decorators or APIs

## Test Plan

- [ ] resources/subscribe returns METHOD_NOT_FOUND without handler
- [ ] resources/unsubscribe returns METHOD_NOT_FOUND without handler
- [ ] Custom handlers receive correct params and context
- [ ] Handler errors return INTERNAL_ERROR
- [ ] Query param fallback works with uriSchema
- [ ] Query param fallback skipped without uriSchema
"
```

---

## Summary Checklist

- [ ] Fork and clone @platformatic/mcp
- [ ] Create feature branch
- [ ] Modify `src/handlers.ts`:
  - [ ] Add `handleResourcesSubscribe` function
  - [ ] Add `handleResourcesUnsubscribe` function
  - [ ] Add query param fallback in `handleResourcesRead`
  - [ ] Update `handleRequest` switch statement
- [ ] Modify `src/decorators/meta.ts`:
  - [ ] Accept `resourceHandlers` in options
  - [ ] Add `mcpSetResourcesSubscribeHandler` decorator
  - [ ] Add `mcpSetResourcesUnsubscribeHandler` decorator
- [ ] Modify `src/types.ts`:
  - [ ] Add handler context and param types
  - [ ] Add handler function types
  - [ ] Add Fastify declaration merging
- [ ] Modify `src/index.ts`:
  - [ ] Create `resourceHandlers` object
  - [ ] Pass to metaDecorators
  - [ ] Pass to routes
- [ ] Modify `src/routes/mcp.ts`:
  - [ ] Accept `resourceHandlers` in options
  - [ ] Include in handler dependencies
- [ ] Add tests for subscription handlers
- [ ] Add tests for query param URI matching
- [ ] Update README.md
- [ ] Build and verify
- [ ] Create PR

---

---

## Additional Feature: Excluded Paths for Authorization

The patch also includes support for `excludedPaths` in the `AuthorizationConfig`, allowing specific routes (like health checks) to bypass OAuth authentication.

### The Problem

When OAuth authorization is enabled via `@platformatic/mcp`, **all routes** are protected by the auth preHandler. This includes health check endpoints that monitoring systems need to access without authentication.

### Solution

Add an `excludedPaths` option to `AuthorizationConfig` that accepts an array of string prefixes or RegExp patterns:

```typescript
const authorization: AuthorizationConfig = {
  enabled: true,
  authorizationServers: ['https://auth.example.com'],
  resourceUri: 'http://localhost:4000',
  excludedPaths: ['/health', '/metrics', /^\/public\//], // NEW
  tokenValidation: {
    jwksUri: 'https://auth.example.com/.well-known/jwks.json',
  },
};
```

### Implementation

#### 1. Modify `src/auth/prehandler.ts`

Add excluded paths check after existing well-known/OAuth skips:

```typescript
export function createAuthPreHandler(
  config: AuthorizationConfig,
  tokenValidator: TokenValidator
) {
  return async function authPreHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!config.enabled) return;

    // Existing skips for well-known and OAuth
    if (
      request.url.startsWith('/.well-known/') ||
      request.url.startsWith('/mcp/.well-known')
    )
      return;
    if (request.url.startsWith('/oauth/authorize')) return;

    // Skip authorization for custom excluded paths
    if (
      config.excludedPaths?.some((path) =>
        typeof path === 'string'
          ? request.url.startsWith(path)
          : path.test(request.url)
      )
    ) {
      return;
    }

    // ... rest of auth logic
  };
}
```

#### 2. Update `src/types/auth-types.ts`

Add the `excludedPaths` property to the enabled authorization config:

```typescript
export type AuthorizationConfig =
  | {
      enabled: false;
    }
  | {
      enabled: true;
      authorizationServers: string[];
      resourceUri: string;
      /** Paths to exclude from authorization (e.g., health checks). Supports string prefix or RegExp. */
      excludedPaths?: (string | RegExp)[];
      tokenValidation: {
        introspectionEndpoint?: string;
        jwksUri?: string;
        validateAudience?: boolean;
      };
      oauth2Client?: {
        clientId?: string;
        clientSecret?: string;
        authorizationServer: string;
        resourceUri?: string;
        scopes?: string[];
        dynamicRegistration?: boolean;
      };
    };
```

### Test Scenarios

- [ ] Excluded string path bypasses auth (`/health` excluded, `GET /health` returns 200)
- [ ] Excluded RegExp path bypasses auth (`/^\/public\//` excluded, `GET /public/docs` returns 200)
- [ ] Non-excluded paths still require auth (`GET /mcp` returns 401 without token)
- [ ] Multiple excluded paths work together
- [ ] Partial prefix matching works (`/health` excludes `/health/detailed`)

### Usage Example

```typescript
import mcpPlugin from '@platformatic/mcp';

// Register health endpoint before MCP plugin
fastify.get('/health', async () => ({ status: 'ok' }));

// Register MCP with excluded paths
await fastify.register(mcpPlugin, {
  serverInfo: { name: 'my-server', version: '1.0.0' },
  authorization: {
    enabled: true,
    authorizationServers: ['https://auth.example.com'],
    resourceUri: 'http://localhost:4000',
    excludedPaths: ['/health'], // Health check accessible without auth
    tokenValidation: {
      jwksUri: 'https://auth.example.com/.well-known/jwks.json',
    },
  },
});
```

---

## Updated Summary Checklist

Add these items to the checklist:

- [ ] Modify `src/auth/prehandler.ts`:
  - [ ] Add `excludedPaths` check after existing well-known skips
  - [ ] Support both string prefix and RegExp matching
- [ ] Modify `src/types/auth-types.ts`:
  - [ ] Add `excludedPaths?: (string | RegExp)[]` to enabled config
- [ ] Add tests for excluded paths functionality
- [ ] Update README.md with excludedPaths documentation

---

## Additional Feature: OIDC Discovery for OAuth Client

The patch also includes OIDC Discovery support in the OAuth client, allowing it to dynamically fetch OAuth endpoint URLs from the authorization server's `/.well-known/openid-configuration` document.

### The Problem

The `@platformatic/mcp` OAuth client hardcodes OAuth endpoint paths:

| Function                     | Hardcoded Path      | Ory Actual Path      |
| ---------------------------- | ------------------- | -------------------- |
| `createAuthorizationRequest` | `/oauth/authorize`  | `/oauth2/auth`       |
| `exchangeCodeForToken`       | `/oauth/token`      | `/oauth2/token`      |
| `refreshToken`               | `/oauth/token`      | `/oauth2/token`      |
| `validateToken`              | `/oauth/introspect` | `/oauth2/introspect` |
| `dynamicClientRegistration`  | `/oauth/register`   | `/oauth2/register`   |

This breaks compatibility with Ory Hydra and other OAuth providers that don't use the `/oauth/*` path convention.

### Solution

Implement OIDC Discovery to dynamically fetch endpoints from `/.well-known/openid-configuration`:

```typescript
// Add at top of oauth-client.ts after imports
let discoveryCache = null;
let discoveryCacheTime = 0;
const DISCOVERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function discoverOIDCEndpoints(
  authorizationServer: string,
  logger?: FastifyBaseLogger
) {
  const now = Date.now();
  if (discoveryCache && now - discoveryCacheTime < DISCOVERY_CACHE_TTL) {
    return discoveryCache;
  }

  try {
    const discoveryUrl = `${authorizationServer}/.well-known/openid-configuration`;
    logger?.info(
      { discoveryUrl },
      'OAuth client: fetching OIDC discovery document'
    );
    const response = await fetch(discoveryUrl);
    if (response.ok) {
      const metadata = await response.json();
      discoveryCache = {
        authorizationEndpoint: metadata.authorization_endpoint,
        tokenEndpoint: metadata.token_endpoint,
        introspectionEndpoint: metadata.introspection_endpoint,
        registrationEndpoint: metadata.registration_endpoint,
      };
      discoveryCacheTime = now;
      logger?.info(
        { endpoints: discoveryCache },
        'OAuth client: OIDC endpoints discovered'
      );
      return discoveryCache;
    }
    logger?.warn(
      { status: response.status },
      'OAuth client: OIDC discovery failed, using defaults'
    );
  } catch (error) {
    logger?.warn(
      { error: error.message },
      'OAuth client: OIDC discovery error, using defaults'
    );
  }

  // Default endpoints (original behavior for backwards compatibility)
  const defaults = {
    authorizationEndpoint: `${authorizationServer}/oauth/authorize`,
    tokenEndpoint: `${authorizationServer}/oauth/token`,
    introspectionEndpoint: `${authorizationServer}/oauth/introspect`,
    registrationEndpoint: `${authorizationServer}/oauth/register`,
  };
  discoveryCache = defaults;
  discoveryCacheTime = now;
  return defaults;
}
```

### Implementation

#### 1. Modify `src/auth/oauth-client.ts`

Add the discovery function at the top of the file, then call it on plugin initialization:

```typescript
const oauthClientPlugin = async (fastify, opts) => {
  // Discover OIDC endpoints on startup
  const endpoints = await discoverOIDCEndpoints(
    opts.authorizationServer,
    fastify.log
  );

  const oauthClientMethods = {
    // ... methods now use endpoints.authorizationEndpoint, etc.
  };
};
```

Update each method to use discovered endpoints:

```typescript
// createAuthorizationRequest
const authorizationUrl = `${endpoints.authorizationEndpoint}?${params.toString()}`;

// exchangeCodeForToken
const tokenResponse = await fetch(endpoints.tokenEndpoint, { ... });

// refreshToken
const tokenResponse = await fetch(endpoints.tokenEndpoint, { ... });

// validateToken
const introspectionResponse = await fetch(endpoints.introspectionEndpoint, { ... });

// dynamicClientRegistration
const registrationResponse = await fetch(endpoints.registrationEndpoint, { ... });
```

### Design Decisions

1. **5-minute cache TTL**: Reduces network overhead while allowing for configuration changes
2. **Graceful fallback**: If discovery fails, uses original hardcoded paths for backward compatibility
3. **Discovery on startup**: Endpoints are fetched once when the plugin initializes, not on each request
4. **Logging**: Info level for successful discovery, warn level for failures (helps debugging)

### OIDC Metadata Fields Used

| OIDC Field               | Used For                    |
| ------------------------ | --------------------------- |
| `authorization_endpoint` | OAuth authorization URL     |
| `token_endpoint`         | Token exchange and refresh  |
| `introspection_endpoint` | Token validation            |
| `registration_endpoint`  | Dynamic client registration |

### Test Scenarios

- [ ] Discovery succeeds: endpoints from OIDC metadata are used
- [ ] Discovery fails (404): default `/oauth/*` paths are used
- [ ] Discovery fails (network error): default paths are used
- [ ] Cache works: second request within 5 minutes uses cached endpoints
- [ ] Cache expires: request after 5 minutes re-fetches discovery document
- [ ] Ory Hydra integration: full OAuth flow works with discovered endpoints

---

## Additional Feature: Missing `redirect_uri` in Authorization Request

The patch also fixes a missing `redirect_uri` parameter in the OAuth authorization request.

### The Problem

The `/oauth/authorize` route in `auth-routes.js` calls `createAuthorizationRequest()` without including the `redirect_uri` parameter:

```typescript
// Original code - missing redirect_uri
const authRequest = await fastify.oauthClient.createAuthorizationRequest({
  ...(resource && { resource }),
});
```

When using OpenID Connect 1.0, the `redirect_uri` parameter is **required**. Ory Hydra returns this error:

```
The 'redirect_uri' parameter is required when using OpenID Connect 1.0.
```

### Solution

Include `redirect_uri` in the authorization request, computed from the server's resource URI or the incoming request:

```typescript
// Build the callback URL for the OAuth flow
// Use request.host (includes port) instead of request.hostname (excludes port)
const callbackUrl = `${opts.resourceUri || `${request.protocol}://${request.host}`}/oauth/callback`;

const authRequest = await fastify.oauthClient.createAuthorizationRequest({
  ...(resource && { resource }),
  redirect_uri: callbackUrl,
});
```

### Implementation

#### Modify `src/routes/auth-routes.ts`

In the `/oauth/authorize` route handler:

```typescript
fastify.get('/oauth/authorize', { ... }, async (request, reply) => {
    try {
        const { resource, redirect_uri } = request.query;

        // Build the callback URL for the OAuth flow
        // Use request.host (includes port) instead of request.hostname (excludes port)
        const callbackUrl = `${opts.resourceUri || `${request.protocol}://${request.host}`}/oauth/callback`;

        // Create authorization request with PKCE - now includes redirect_uri
        const authRequest = await fastify.oauthClient.createAuthorizationRequest({
            ...(resource && { resource }),
            redirect_uri: callbackUrl
        });
        // ... rest of handler
    }
});
```

### Design Decisions

1. **Prefer `opts.resourceUri`**: Uses the configured resource URI if available for consistency
2. **Fallback to request origin**: If no resourceUri configured, builds URL from request protocol and host
3. **Use `request.host` not `request.hostname`**: `request.host` includes the port (e.g., `localhost:4000`), while `request.hostname` excludes it (e.g., `localhost`)
4. **Fixed callback path**: Always uses `/oauth/callback` as the callback endpoint

### Test Scenarios

- [ ] Authorization request includes `redirect_uri` parameter
- [ ] `redirect_uri` uses configured `resourceUri` when available
- [ ] `redirect_uri` includes port when falling back to request origin
- [ ] Ory Hydra accepts the authorization request without "redirect_uri required" error

---

## Additional Feature: Missing `/oauth/callback` in Auth Prehandler Skip List

The patch also fixes the auth prehandler to skip the OAuth callback endpoint.

### The Problem

The `/oauth/callback` route receives the authorization code from the OAuth provider (Ory). However, the auth prehandler only skips `/oauth/authorize`, not `/oauth/callback`:

```typescript
// Original code - only skips /oauth/authorize
if (request.url.startsWith('/oauth/authorize')) {
  return;
}
```

When the user is redirected back from Ory with the authorization code, the prehandler blocks the request because there's no Bearer token yet:

```json
{
  "error": "authorization_required",
  "error_description": "Authorization header required"
}
```

### Solution

Add `/oauth/callback` to the list of skipped paths:

```typescript
// Skip authorization for OAuth flow endpoints (authorize initiates, callback receives code)
if (
  request.url.startsWith('/oauth/authorize') ||
  request.url.startsWith('/oauth/callback')
) {
  return;
}
```

### Implementation

#### Modify `src/auth/prehandler.ts`

```typescript
export function createAuthPreHandler(config, tokenValidator) {
  return async function authPreHandler(request, reply) {
    // ... existing skips ...

    // Skip authorization for OAuth flow endpoints (authorize initiates, callback receives code)
    if (
      request.url.startsWith('/oauth/authorize') ||
      request.url.startsWith('/oauth/callback')
    ) {
      return;
    }

    // ... rest of handler
  };
}
```

### Test Scenarios

- [ ] `/oauth/callback` bypasses auth prehandler
- [ ] Callback can process authorization code without Bearer token
- [ ] Other routes still require authentication

---

## Additional Feature: Missing `redirect_uri` in Token Exchange

The patch also fixes the token exchange to include the `redirect_uri` parameter.

### The Problem

When exchanging the authorization code for tokens, the `redirect_uri` must match exactly the one used in the authorization request. The original `exchangeCodeForToken` method doesn't include it:

```typescript
// Original code - missing redirect_uri in token exchange
body: new URLSearchParams({
  grant_type: 'authorization_code',
  code,
  client_id: opts.clientId || '',
  code_verifier: pkce.codeVerifier,
  ...(opts.clientSecret && { client_secret: opts.clientSecret }),
}).toString();
```

Ory returns this error:

```json
{
  "error": "invalid_grant",
  "error_description": "The 'redirect_uri' from this request does not match the one from the authorize request."
}
```

### Solution

1. Store the `callbackUrl` in the session during authorization
2. Pass it to `exchangeCodeForToken`
3. Include it in the token request body

### Implementation

#### 1. Modify `src/routes/auth-routes.ts` - Store callbackUrl in session

```typescript
// In /oauth/authorize handler
const sessionData = {
  state: authRequest.state,
  pkce: authRequest.pkce,
  resourceUri: resource,
  originalUrl: redirect_uri,
  // Store the callback URL for token exchange (must match exactly)
  callbackUrl,
};
```

#### 2. Modify `src/routes/auth-routes.ts` - Pass to exchangeCodeForToken

```typescript
// In /oauth/callback handler
const tokens = await fastify.oauthClient.exchangeCodeForToken(
  code,
  sessionData.pkce,
  sessionData.state,
  state,
  sessionData.callbackUrl // Pass the redirect_uri
);
```

#### 3. Modify `src/auth/oauth-client.ts` - Accept and use redirect_uri

```typescript
async exchangeCodeForToken(code, pkce, state, receivedState, redirectUri) {
    // ... validation ...
    const tokenResponse = await fetch(endpoints.tokenEndpoint, {
        method: 'POST',
        headers: { /* ... */ },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: opts.clientId || '',
            code_verifier: pkce.codeVerifier,
            ...(opts.clientSecret && { client_secret: opts.clientSecret }),
            // redirect_uri must match the one used in authorization request (required for OIDC)
            ...(redirectUri && { redirect_uri: redirectUri })
        }).toString()
    });
    // ...
}
```

### Test Scenarios

- [ ] Token exchange includes `redirect_uri` parameter
- [ ] `redirect_uri` in token request matches authorization request exactly
- [ ] Ory accepts token exchange without "redirect_uri mismatch" error
- [ ] Full OAuth flow completes successfully

---

## Verification - Complete OAuth Flow

To verify all OIDC fixes work together with Ory:

1. Start the MCP server with Ory authorization configured
2. Check logs for "OIDC endpoints discovered" message with correct Ory URLs:
   ```
   OAuth client: OIDC endpoints discovered {
     authorizationEndpoint: 'https://xxx.projects.oryapis.com/oauth2/auth',
     tokenEndpoint: 'https://xxx.projects.oryapis.com/oauth2/token',
     introspectionEndpoint: 'https://xxx.projects.oryapis.com/admin/oauth2/introspect',
     registrationEndpoint: 'https://xxx.projects.oryapis.com/oauth2/register'
   }
   ```
3. Navigate to `http://localhost:4000/oauth/authorize`
4. Should redirect to Ory's `/oauth2/auth` endpoint with `redirect_uri` parameter
5. Complete login at Ory
6. Should redirect back to `/oauth/callback` with authorization code
7. Token exchange should succeed (redirect_uri matches)
8. Should receive tokens in JSON response

---

## Updated Summary Checklist

Add these items to the checklist:

**OIDC Discovery:**

- [ ] Modify `src/auth/oauth-client.ts`:
  - [ ] Add `discoverOIDCEndpoints` function with caching
  - [ ] Call discovery on plugin initialization
  - [ ] Update `createAuthorizationRequest` to use `endpoints.authorizationEndpoint`
  - [ ] Update `exchangeCodeForToken` to use `endpoints.tokenEndpoint`
  - [ ] Update `refreshToken` to use `endpoints.tokenEndpoint`
  - [ ] Update `validateToken` to use `endpoints.introspectionEndpoint`
  - [ ] Update `dynamicClientRegistration` to use `endpoints.registrationEndpoint`

**redirect_uri in Authorization Request:**

- [ ] Modify `src/routes/auth-routes.ts`:
  - [ ] Build `callbackUrl` from `opts.resourceUri` or request origin
  - [ ] Include `redirect_uri: callbackUrl` in `createAuthorizationRequest`
  - [ ] Store `callbackUrl` in session data

**OAuth Callback Prehandler Skip:**

- [ ] Modify `src/auth/prehandler.ts`:
  - [ ] Add `/oauth/callback` to skipped paths

**redirect_uri in Token Exchange:**

- [ ] Modify `src/auth/oauth-client.ts`:
  - [ ] Add `redirectUri` parameter to `exchangeCodeForToken`
  - [ ] Include in token request body
- [ ] Modify `src/routes/auth-routes.ts`:
  - [ ] Pass `sessionData.callbackUrl` to `exchangeCodeForToken`

**Tests:**

- [ ] Add tests for OIDC discovery
- [ ] Add tests for redirect_uri handling
- [ ] Add integration test for complete OAuth flow

**Documentation:**

- [ ] Update README.md with OIDC compatibility notes

---

## Notes

- The patch file at `patches/@platformatic+mcp+1.2.2.patch` shows the exact diff for the compiled JS
- For the PR, modify the TypeScript source files (`src/*.ts`) instead of the compiled output
- The type definitions in `src/types/mcp-context.ts` from this project show the TypeScript patterns to follow
- The e2e tests in `src/resources/resources.e2e-test.ts` can be adapted for the upstream test suite
