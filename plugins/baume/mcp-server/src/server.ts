/**
 * Baume API Hygiene MCP Server
 *
 * Built with @getlarge/fastify-mcp for Fastify-native MCP support with OAuth2.
 */

import Fastify from 'fastify';
import mcpPlugin from '@getlarge/fastify-mcp';
import type {
  AuthorizationConfig,
  DCRRequest,
  DCRResponse,
} from '@getlarge/fastify-mcp';

import { securityPlugin } from './plugins/security.js';
import {
  initTempStorage,
  shutdownTempStorage,
  getTempStorage,
} from './services/temp-storage.js';
import {
  initFindingsStorage,
  shutdownFindingsStorage,
} from './services/findings-storage.js';
import {
  initSubscriptionStore,
  shutdownSubscriptionStore,
} from './services/subscription-store/index.js';
import { WorkerPool } from './tools/worker-pool.js';
import { registerBaumeTools } from './tools/register.js';
import { registerBaumeResources } from './resources/register.js';
import { registerBaumePrompts } from './prompts/register.js';
import { getStorageConfig, buildStoreOptions } from './config/index.js';

// =============================================================================
// Server Configuration
// =============================================================================

export const SERVER_NAME = 'baume';
export const SERVER_VERSION = '1.0.0';

export interface ServerConfig {
  port?: number;
  host?: string;
  /** Path to worker bundle (for bundled deployments) */
  workerPath?: string;
}

export interface OryAuthConfig {
  enabled: boolean;
  projectUrl?: string;
  projectApiKey?: string;
  jwksUri?: string;
  introspectionEndpoint?: string;
  resourceUri?: string;
  scopes?: string[];
}

const DEFAULT_CONFIG = {
  port: 4000,
  host: '0.0.0.0',
} satisfies Omit<Required<ServerConfig>, 'workerPath'>;

/**
 * Clean DCR response to remove empty/null fields that break Claude Code's Zod validation.
 * Claude Code expects optional URI fields to be valid URLs or absent, not empty strings.
 * See: https://github.com/anthropics/claude-code/issues/13685
 */
function cleanDcrResponse(response: DCRResponse): DCRResponse {
  const cleaned = { ...response };

  // Fields that must be valid URLs or absent (not empty strings)
  const uriFields = [
    'client_uri',
    'logo_uri',
    'tos_uri',
    'policy_uri',
    'jwks_uri',
  ] as const;
  for (const field of uriFields) {
    if (cleaned[field] === '' || cleaned[field] === null) {
      delete cleaned[field];
    }
  }

  // Fields that must be arrays or absent (not null)
  if (cleaned.contacts === null) {
    delete cleaned.contacts;
  }

  return cleaned;
}

/**
 * Build authorization config from environment or explicit config.
 */
function buildAuthConfig(config?: OryAuthConfig): AuthorizationConfig {
  // Check environment variables if no explicit config
  const projectUrl = config?.projectUrl ?? process.env['ORY_PROJECT_URL'];
  const projectApiKey =
    config?.projectApiKey ?? process.env['ORY_PROJECT_API_KEY'];
  const resourceUri = config?.resourceUri ?? process.env['MCP_RESOURCE_URI'];
  const clientId = process.env['OAUTH_CLIENT_ID'];
  const clientSecret = process.env['OAUTH_CLIENT_SECRET'];

  // Auth enabled via explicit config or AUTH_ENABLED env var
  const authEnabled = config?.enabled ?? process.env['AUTH_ENABLED'] === 'true';

  // Auth is disabled if no Ory config is provided or not enabled
  if (!projectUrl || !authEnabled) {
    return { enabled: false };
  }

  // Check if audience validation should be disabled (for debugging)
  const validateAudience = process.env['VALIDATE_AUDIENCE'] !== 'false';

  return {
    enabled: true,
    authorizationServers: [projectUrl],
    resourceUri: resourceUri ?? `http://localhost:${DEFAULT_CONFIG.port}`,
    // Health endpoint excluded from OAuth
    excludedPaths: ['/health'],
    tokenValidation: {
      // Prefer JWKS for JWT validation (works without API key)
      jwksUri: config?.jwksUri ?? `${projectUrl}/.well-known/jwks.json`,
      // Introspection requires admin API key (optional)
      introspectionEndpoint:
        config?.introspectionEndpoint ??
        (projectApiKey ? `${projectUrl}/admin/oauth2/introspect` : undefined),
      // Introspection auth - use bearer token with Ory API key if available
      introspectionAuth: projectApiKey
        ? { type: 'bearer' as const, token: projectApiKey }
        : undefined,
      // Audience validation can be disabled via VALIDATE_AUDIENCE=false
      validateAudience,
    },
    // OAuth2 client config - supports both static credentials and dynamic registration
    oauth2Client: {
      // Static credentials (optional - if not provided, DCR will be used)
      ...(clientId && clientSecret ? { clientId, clientSecret } : {}),
      authorizationServer: projectUrl,
      resourceUri: resourceUri ?? `http://localhost:${DEFAULT_CONFIG.port}`,
      scopes: config?.scopes ?? ['openid'],
      // Enable DCR when no static credentials are configured
      dynamicRegistration: !clientId || !clientSecret,
    },
    // DCR hooks for proxying to Ory and cleaning responses
    dcrHooks: {
      // Bypass OIDC discovery to avoid infinite loop when registration_endpoint points to us
      upstreamEndpoint: `${projectUrl}/oauth2/register`,
      onRequest: (request: DCRRequest, log) => {
        log.info({ dcrRequest: request }, 'DCR: forwarding request to Ory');
        return request;
      },
      onResponse: (response: DCRResponse, request: DCRRequest, log) => {
        log.info({ dcrResponse: response }, 'DCR: received response from Ory');
        // Clean response to remove empty/null fields that break Claude Code's Zod validation
        const cleaned = cleanDcrResponse(response);
        log.info({ dcrCleanedResponse: cleaned }, 'DCR: cleaned response');
        return cleaned;
      },
    },
  };
}

// =============================================================================
// Main Server Setup
// =============================================================================

export async function createServer(
  config: ServerConfig = {},
  authConfig?: OryAuthConfig
) {
  const { port, host, workerPath } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  });

  // Security plugin (CORS, headers)
  await fastify.register(securityPlugin);

  // Get storage configuration from environment
  const storageConfig = getStorageConfig();
  fastify.log.info(
    { storeType: storageConfig.type, hasS3: !!storageConfig.s3 },
    'Storage configuration loaded'
  );

  // Initialize storage layers with configuration
  const tempStoreOptions = await buildStoreOptions(storageConfig, 'temp');
  await initTempStorage(tempStoreOptions);

  const findingsStoreOptions = await buildStoreOptions(
    storageConfig,
    'findings'
  );
  await initFindingsStorage(findingsStoreOptions);

  // Initialize worker pool for CPU-intensive operations
  const workerPool = new WorkerPool(undefined, workerPath);
  await workerPool.initialize();
  fastify.log.info(
    { poolSize: workerPool.stats.total },
    'Worker pool initialized'
  );

  // Health endpoint (registered before MCP plugin to bypass OAuth)
  fastify.get('/health', async () => {
    const tempStorage = getTempStorage();
    return {
      status: 'ok',
      version: SERVER_VERSION,
      tempStorage: tempStorage.stats,
      workerPool: workerPool.stats,
    };
  });

  // Build authorization config
  const authorization = buildAuthConfig(authConfig);
  if (authorization.enabled) {
    fastify.log.info(
      {
        authorizationServers: authorization.authorizationServers,
        resourceUri: authorization.resourceUri,
        validateAudience: authorization.tokenValidation?.validateAudience,
        jwksUri: authorization.tokenValidation?.jwksUri,
      },
      'OAuth2 authorization enabled'
    );
  } else {
    fastify.log.info('OAuth2 authorization disabled');
  }

  // Register @getlarge/fastify-mcp plugin
  await fastify.register(mcpPlugin, {
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
    instructions: `Baume API Hygiene Coach - Analyze and fix REST/OpenAPI APIs following API best practices.

Use when: reviewing OpenAPI/Swagger specs, linting API design, fixing violations, checking naming conventions, pagination, error handling, idempotency.

Workflow: Start with baume-review to analyze a spec, then use baume-apply-fixes to auto-fix issues or baume-correlate to find code locations (NestJS, Fastify, Express).

Categories: naming (AIP-122), standard methods (AIP-131-135), pagination (AIP-158), errors (AIP-193), idempotency (AIP-155), filtering (AIP-132/160).`,
    enableSSE: true,
    // Use in-memory stores for sessions and messages (can be changed to Redis if needed)
    sessionStore: 'memory',
    messageBroker: 'memory',
    authorization,
  });

  // Initialize subscription store (uses same redis config pattern as mcp plugin)
  await initSubscriptionStore();

  // Register Baume tools using mcpAddTool
  registerBaumeTools(fastify, { workerPool });

  // Register Baume resources using mcpAddResource
  registerBaumeResources(fastify);

  // Register Baume prompts using mcpAddPrompt
  registerBaumePrompts(fastify);

  return {
    fastify,
    async start() {
      await fastify.listen({ port, host });
      fastify.log.info(`MCP server listening on http://${host}:${port}`);
      fastify.log.info(`MCP endpoint: /mcp`);
      fastify.log.info(`OAuth metadata: /.well-known/oauth-protected-resource`);
    },
    async stop() {
      await workerPool.shutdown();
      await shutdownSubscriptionStore();
      await shutdownFindingsStorage();
      await shutdownTempStorage();
      await fastify.close();
    },
  };
}
