/**
 * Resources List Handler
 *
 * Implements MCP resources/list to expose cached findings and specs.
 * Returns resources sorted by creation time with annotations for priority.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getFindingsStorage } from '../services/findings-storage.js';
import { getTempStorage } from '../services/temp-storage.js';

export function registerResourcesList(server: Server) {
  server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
    const params = request.params ?? {};
    const findingsStore = getFindingsStorage();
    const tempStore = getTempStorage();

    // Get findings and specs (single-user mode: no filtering)
    const findings = await findingsStore.listAll({
      cursor: params.cursor,
      pageSize: 50,
    });

    const specs = await tempStore.listAll({
      cursor: params.cursor,
      pageSize: 50,
    });

    // Build resource list
    const resources = [
      ...findings.items.map((f) => {
        // Check if findings have code locations (correlated)
        const hasCodeLocations = f.content.includes('codeLocations');
        return {
          uri: `aip://findings/${f.id}`,
          name: `findings-${f.id}.json`,
          description: hasCodeLocations
            ? 'AIP review findings with code locations'
            : 'AIP review findings',
          mimeType: 'application/json',
          annotations: {
            audience: ['assistant'],
            priority: hasCodeLocations ? 0.9 : 0.8,
            lastModified: new Date(f.createdAt).toISOString(),
          },
        };
      }),
      ...specs.items.map((s) => ({
        uri: `aip://specs/${s.id}`,
        name: s.id.includes('.yaml') ? s.id : `${s.id}.json`,
        description: 'Modified OpenAPI spec',
        mimeType:
          s.contentType === 'yaml' ? 'application/x-yaml' : 'application/json',
        annotations: {
          audience: ['assistant'],
          priority: 0.6,
          lastModified: new Date(s.createdAt).toISOString(),
        },
      })),
    ];

    // Combine cursors (simple approach: use findings cursor as primary)
    const nextCursor = findings.nextCursor || specs.nextCursor;

    return {
      resources,
      nextCursor,
    };
  });
}
