/**
 * MCP Server Factory
 *
 * Creates MCP server with all tools registered.
 * Used by both HTTP and STDIO transports.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';
import { registerResourcesList } from './resources/list.js';
import { registerResourcesRead } from './resources/read.js';
import { registerResourcesTemplates } from './resources/templates.js';
import { getFindingsStorage } from './services/findings-storage.js';
import { getTempStorage } from './services/temp-storage.js';
import { createLogger } from './services/logging.js';
import type { ToolContext, ExtendedToolContext } from './tools/types.js';

export const SERVER_NAME = 'aip-openapi-reviewer';
export const SERVER_VERSION = '1.0.0';

/**
 * Create and configure the MCP server with all AIP tools.
 *
 * @param context - Tool context containing shared dependencies (worker pool)
 */
export function createMcpServer(context: ToolContext) {
  const mcpServer = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        resources: {
          listChanged: true,
          subscribe: true,
        },
        tools: {
          listChanged: true,
        },
      },
    }
  );

  // Build extended context with server reference for tools that need it
  const extendedContext: ExtendedToolContext = {
    ...context,
    server: mcpServer.server,
  };

  registerTools(mcpServer, extendedContext);

  // Register resource handlers (capabilities exposed automatically)
  registerResourcesList(mcpServer.server);
  registerResourcesRead(mcpServer.server);
  registerResourcesTemplates(mcpServer.server);

  // Wire up storage event listeners to send MCP resource notifications
  const findingsStore = getFindingsStorage();
  const tempStore = getTempStorage();
  const logger = createLogger(mcpServer.server, 'resources');

  // TODO: redesign the notifications to target specific clients/sessions/subscriptions based on resource "ownership"
  // Send list_changed notification when resources are added or removed
  const sendResourceListChanged = () => {
    mcpServer.server
      .notification({
        method: 'notifications/resources/list_changed',
      })
      .catch((err) => {
        logger.error('Failed to send resource list changed notification', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  // Send updated notification when a specific resource's contents change
  const sendResourceUpdated = (event: { id: string; type: string }) => {
    const uri = `aip://${event.type}/${event.id}`;
    mcpServer.server
      .notification({
        method: 'notifications/resources/updated',
        params: { uri },
      })
      .catch((err) => {
        logger.error('Failed to send resource updated notification', {
          uri,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  };

  findingsStore.on('resource:created', sendResourceListChanged);
  findingsStore.on('resource:updated', sendResourceUpdated);
  findingsStore.on('resource:deleted', sendResourceListChanged);

  tempStore.on('resource:created', sendResourceListChanged);
  tempStore.on('resource:updated', sendResourceUpdated);
  tempStore.on('resource:deleted', sendResourceListChanged);

  return mcpServer;
}
