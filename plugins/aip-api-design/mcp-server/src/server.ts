/**
 * AIP OpenAPI Reviewer MCP Server
 *
 * MCP integration code adapted from fastify-mcp
 * https://github.com/haroldadmin/fastify-mcp
 * Licensed under MIT
 */

import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { createMcpServer, SERVER_VERSION } from './mcp.js';
import { securityPlugin } from './plugins/security.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import {
  initTempStorage,
  shutdownTempStorage,
  getTempStorage,
} from './services/temp-storage.js';
import {
  initFindingsStorage,
  shutdownFindingsStorage,
} from './services/findings-storage.js';
import { WorkerPool } from './tools/worker-pool.js';
import type { ToolContext } from './tools/types.js';
import {
  createStatefulTransport,
  invalidSessionId,
  Sessions,
} from './sessions.js';

// ============================================================================
// Server Configuration
// ============================================================================

export interface ServerConfig {
  port?: number;
  host?: string;
  mcpEndpoint?: string;
  baseUrl?: string;
}

const DEFAULT_CONFIG: Required<ServerConfig> = {
  port: 4000,
  host: '0.0.0.0',
  mcpEndpoint: '/mcp',
  baseUrl: 'http://localhost:4000',
};

// ============================================================================
// Main Server Setup
// ============================================================================

export async function createServer(config: ServerConfig = {}) {
  const { port, host, mcpEndpoint, baseUrl } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const fastify = Fastify({
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  await fastify.register(securityPlugin);
  await fastify.register(rateLimitPlugin);
  // TODO: add authentication plugin and store user info in request context (AsyncLocalStorage)
  // await fastify.register(authPlugin);

  // Session storage for stateful mode
  const sessions = new Sessions<StreamableHTTPServerTransport>();
  // Initialize temp storage for storing modified specs
  await initTempStorage({
    type: 'sqlite',
    baseUrl,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize findings storage for caching review results
  // Uses longer TTL (1 day) since findings are useful across sessions
  await initFindingsStorage({
    type: 'sqlite',
    baseUrl,
    ttlMs: 24 * 60 * 60 * 1000,
  });

  const workerPool = new WorkerPool();
  await workerPool.initialize();
  fastify.log.info(
    { poolSize: workerPool.stats.total },
    'Worker pool initialized'
  );

  const toolContext: ToolContext = { workerPool };

  sessions.on('connected', (id) => {
    fastify.log.info({ sessionId: id }, 'MCP session connected');
  });
  sessions.on('terminated', (id) => {
    fastify.log.info({ sessionId: id }, 'MCP session terminated');
  });

  fastify.get('/health', async () => {
    const tempStorage = getTempStorage();
    return {
      status: 'ok',
      version: SERVER_VERSION,
      sessions: sessions.count,
      tempStorage: tempStorage.stats,
      workerPool: workerPool.stats,
    };
  });

  // MCP routes (stateful session management)
  fastify.post(mcpEndpoint, async (req, reply) => {
    const sessionId = req.headers['mcp-session-id'];
    if (Array.isArray(sessionId)) {
      return invalidSessionId(reply);
    }

    if (!sessionId) {
      if (!isInitializeRequest(req.body)) {
        return invalidSessionId(reply);
      }

      const transport = createStatefulTransport(sessions);
      const server = createMcpServer(toolContext);
      await server.connect(transport);
      await transport.handleRequest(req.raw, reply.raw, req.body);
    } else {
      const transport = sessions.get(sessionId);
      if (!transport) {
        return invalidSessionId(reply);
      }
      await transport.handleRequest(req.raw, reply.raw, req.body);
    }
  });

  fastify.get(mcpEndpoint, async (req, reply) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || Array.isArray(sessionId)) {
      return invalidSessionId(reply);
    }

    const transport = sessions.get(sessionId);
    if (!transport) {
      return invalidSessionId(reply);
    }
    await transport.handleRequest(req.raw, reply.raw, req.body);
  });

  fastify.delete(mcpEndpoint, async (req, reply) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || Array.isArray(sessionId)) {
      return invalidSessionId(reply);
    }

    const transport = sessions.get(sessionId);
    if (!transport) {
      return invalidSessionId(reply);
    }

    await transport.handleRequest(req.raw, reply.raw, req.body);
    sessions.remove(sessionId);
  });

  return {
    fastify,
    sessions,
    async start() {
      await fastify.listen({ port, host });
      fastify.log.info(`MCP server listening on http://${host}:${port}`);
      fastify.log.info(`MCP endpoint: ${mcpEndpoint}`);
      fastify.log.info(`Session management: enabled`);
    },
    async stop() {
      await workerPool.shutdown();
      await shutdownFindingsStorage();
      await shutdownTempStorage();
      await fastify.close();
    },
  };
}
