/**
 * AIP OpenAPI Reviewer MCP Server
 *
 * Built with @platformatic/mcp for Fastify-native MCP support with OAuth2.
 */

import Fastify from 'fastify';
import mcpPlugin from '@platformatic/mcp';
import type { AuthorizationConfig } from '@platformatic/mcp';

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
import { registerAipTools } from './tools/register.js';
import { registerAipResources } from './resources/register.js';
import { registerAipPrompts } from './prompts/register.js';

// =============================================================================
// Server Configuration
// =============================================================================

export const SERVER_NAME = 'aip-openapi-reviewer';
export const SERVER_VERSION = '1.0.0';

export interface ServerConfig {
  port?: number;
  host?: string;
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

const DEFAULT_CONFIG: Required<ServerConfig> = {
  port: 4000,
  host: '0.0.0.0',
};

/**
 * Build authorization config from environment or explicit config.
 */
function buildAuthConfig(config?: OryAuthConfig): AuthorizationConfig {
  // Check environment variables if no explicit config
  const projectUrl = config?.projectUrl ?? process.env['ORY_PROJECT_URL'];
  const projectApiKey =
    config?.projectApiKey ?? process.env['ORY_PROJECT_API_KEY'];
  const resourceUri = config?.resourceUri ?? process.env['MCP_RESOURCE_URI'];

  // Auth is disabled if no Ory config is provided
  if (!projectUrl || !config?.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    authorizationServers: [projectUrl],
    resourceUri: resourceUri ?? `http://localhost:${DEFAULT_CONFIG.port}`,
    tokenValidation: {
      // Prefer JWKS for JWT validation, fallback to introspection
      jwksUri: config?.jwksUri ?? `${projectUrl}/.well-known/jwks.json`,
      introspectionEndpoint:
        config?.introspectionEndpoint ??
        (projectApiKey ? `${projectUrl}/admin/oauth2/introspect` : undefined),
      validateAudience: true,
    },
    oauth2Client: projectApiKey
      ? {
          clientId: process.env['OAUTH_CLIENT_ID'],
          clientSecret: process.env['OAUTH_CLIENT_SECRET'],
          authorizationServer: projectUrl,
          resourceUri: resourceUri ?? `http://localhost:${DEFAULT_CONFIG.port}`,
          scopes: config?.scopes ?? ['openid'],
          dynamicRegistration: false,
        }
      : undefined,
  };
}

// =============================================================================
// Main Server Setup
// =============================================================================

export async function createServer(
  config: ServerConfig = {},
  authConfig?: OryAuthConfig
) {
  const { port, host } = {
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

  // Initialize storage layers
  await initTempStorage({
    type: 'sqlite',
    ttlMs: 5 * 60 * 1000, // 5 minutes
  });

  await initFindingsStorage({
    type: 'sqlite',
    ttlMs: 24 * 60 * 60 * 1000, // 1 day
  });

  // Initialize worker pool for CPU-intensive operations
  const workerPool = new WorkerPool();
  await workerPool.initialize();
  fastify.log.info(
    { poolSize: workerPool.stats.total },
    'Worker pool initialized'
  );

  // Build authorization config
  const authorization = buildAuthConfig(authConfig);
  if (authorization.enabled) {
    fastify.log.info(
      { authorizationServers: authorization.authorizationServers },
      'OAuth2 authorization enabled'
    );
  } else {
    fastify.log.info('OAuth2 authorization disabled');
  }

  // Register @platformatic/mcp plugin
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
    instructions:
      'AIP OpenAPI Reviewer - Analyze OpenAPI specs against Google API Improvement Proposals',
    enableSSE: true,
    authorization,
  });

  // Initialize subscription store (uses same redis config pattern as mcp plugin)
  initSubscriptionStore();

  // Register AIP tools using mcpAddTool
  registerAipTools(fastify, { workerPool });

  // Register AIP resources using mcpAddResource
  registerAipResources(fastify);

  // Register AIP prompts using mcpAddPrompt
  registerAipPrompts(fastify);

  // Health endpoint
  fastify.get('/health', async () => {
    const tempStorage = getTempStorage();
    return {
      status: 'ok',
      version: SERVER_VERSION,
      tempStorage: tempStorage.stats,
      workerPool: workerPool.stats,
    };
  });

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
