/**
 * Resources Read Handler
 *
 * Implements MCP resources/read to fetch resource content by URI.
 * Supports aip://findings/{id} and aip://specs/{id} URIs.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getFindingsStorage } from '../services/findings-storage.js';
import { getTempStorage } from '../services/temp-storage.js';

export function registerResourcesRead(server: Server) {
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Parse URI: aip://findings/{id} or aip://specs/{id}
    const match = uri.match(/^aip:\/\/(findings|specs)\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    const [_, type, id] = match;

    // Get resource from appropriate storage
    let resource;
    if (type === 'findings') {
      const findingsStore = getFindingsStorage();
      resource = await findingsStore.get(id);
    } else if (type === 'specs') {
      const tempStore = getTempStorage();
      resource = await tempStore.get(id);
    }

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Return resource content
    return {
      contents: [
        {
          uri,
          mimeType:
            resource.contentType === 'yaml'
              ? 'application/x-yaml'
              : 'application/json',
          text: resource.content,
        },
      ],
    };
  });
}
