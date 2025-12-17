/**
 * Resources Templates Handler
 *
 * Implements MCP resources/templates/list to expose URI templates.
 * Templates describe the structure of resource URIs for discovery.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourceTemplatesRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export function registerResourcesTemplates(server: Server) {
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'aip://findings/{reviewId}',
          name: 'AIP Review Findings',
          description:
            'Access cached AIP review findings by reviewId (may include code locations if correlated)',
          mimeType: 'application/json',
        },
        {
          uriTemplate: 'aip://specs/{specId}',
          name: 'Modified OpenAPI Specs',
          description: 'Access modified OpenAPI specs by specId',
          mimeType: 'application/octet-stream',
        },
      ],
    };
  });
}
