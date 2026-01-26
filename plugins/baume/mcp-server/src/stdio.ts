#!/usr/bin/env node
/**
 * Baume API Hygiene MCP Server - STDIO Transport
 *
 * Runs the MCP server over standard input/output for local integration
 * with Claude Code and Claude Desktop.
 *
 * Uses @getlarge/fastify-mcp's STDIO transport.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import mcpPlugin from '@getlarge/fastify-mcp';
import { runStdioServer } from '@getlarge/fastify-mcp';

import { securityPlugin } from './plugins/security.js';
import {
  initTempStorage,
  shutdownTempStorage,
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
import { SERVER_NAME, SERVER_VERSION } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Initialize temp storage (memory store with FS for STDIO)
  await initTempStorage({
    type: 'memory',
    memory: { useFileSystem: true },
    ttlMs: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize findings storage for caching review results
  await initFindingsStorage({
    type: 'memory',
    memory: { useFileSystem: true },
    ttlMs: 24 * 60 * 60 * 1000, // 1 day
  });

  // Initialize worker pool with bundled worker path
  // In bundled deployment, worker.bundle.js is alongside stdio.bundle.js
  const workerPath = join(__dirname, 'worker.bundle.js');
  const workerPool = new WorkerPool(undefined, workerPath);
  await workerPool.initialize();
  console.error(
    `Worker pool initialized with ${workerPool.stats.total} workers`
  );

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: 'warn',
      transport: {
        target: 'pino/file',
        options: { destination: 2 }, // stderr
      },
    },
  });

  // Security plugin (for consistent behavior, though not strictly needed in STDIO)
  await fastify.register(securityPlugin);

  // Register @getlarge/fastify-mcp plugin (no authorization for STDIO)
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
      'Baume API Hygiene Coach - Analyze OpenAPI specs against API best practices',
  });

  // Initialize subscription store for resource subscriptions
  await initSubscriptionStore();

  // Register Baume tools, resources, and prompts
  registerBaumeTools(fastify, { workerPool });
  registerBaumeResources(fastify);
  registerBaumePrompts(fastify);

  // Log to stderr to avoid interfering with MCP protocol on stdout
  console.error(`${SERVER_NAME} v${SERVER_VERSION} starting in STDIO mode...`);

  const cleanup = async () => {
    await workerPool.shutdown();
    await shutdownSubscriptionStore();
    await shutdownFindingsStorage();
    await shutdownTempStorage();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Run the STDIO server
  await runStdioServer(fastify);

  console.error(`${SERVER_NAME} connected and ready`);
}

main().catch((err) => {
  console.error('Failed to start STDIO server:', err);
  process.exit(1);
});
