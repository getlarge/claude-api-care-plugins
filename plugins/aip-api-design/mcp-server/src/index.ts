/**
 * AIP OpenAPI Reviewer MCP Server
 *
 * Exposes the AIP OpenAPI reviewer as MCP tools for AI agents.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { createServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env['PORT'] ?? '4000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

// Detect bundled deployment and use worker.bundle.js
const workerBundlePath = join(__dirname, 'worker.bundle.js');
const workerPath = existsSync(workerBundlePath) ? workerBundlePath : undefined;

async function main() {
  const server = await createServer({
    port: PORT,
    host: HOST,
    workerPath,
  });

  // Graceful shutdown
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down...`);
      await server.stop();
      process.exit(0);
    });
  }

  await server.start();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
