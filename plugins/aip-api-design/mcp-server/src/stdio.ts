#!/usr/bin/env node
/**
 * AIP OpenAPI Reviewer MCP Server - STDIO Transport
 *
 * Runs the MCP server over standard input/output for local integration
 * with Claude Code and Claude Desktop.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer, SERVER_NAME, SERVER_VERSION } from './mcp.js';
import {
  initTempStorage,
  shutdownTempStorage,
} from './services/temp-storage.js';
import {
  initFindingsStorage,
  shutdownFindingsStorage,
} from './services/findings-storage.js';
import { WorkerPool } from './tools/worker-pool.js';
import type { ToolContext } from './tools/types.js';

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

  // Initialize worker pool for CPU-intensive operations
  const workerPool = new WorkerPool();
  await workerPool.initialize();
  console.error(
    `Worker pool initialized with ${workerPool.stats.total} workers`
  );

  const toolContext: ToolContext = { workerPool };
  const mcpServer = createMcpServer(toolContext);
  const transport = new StdioServerTransport();

  // Log to stderr to avoid interfering with MCP protocol on stdout
  console.error(`${SERVER_NAME} v${SERVER_VERSION} starting in STDIO mode...`);

  const cleanup = async () => {
    await workerPool.shutdown();
    await shutdownFindingsStorage();
    await shutdownTempStorage();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await mcpServer.connect(transport);

  console.error(`${SERVER_NAME} connected and ready`);
}

main().catch((err) => {
  console.error('Failed to start STDIO server:', err);
  process.exit(1);
});
