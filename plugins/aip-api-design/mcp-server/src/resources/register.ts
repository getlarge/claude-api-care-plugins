/**
 * MCP Resource Registration
 *
 * Registers AIP resources with @platformatic/mcp.
 * Uses mcpAddResource for Fastify-native resource registration.
 *
 * Resources exposed:
 * - aip://findings/{reviewId} - AIP review findings (may include code locations)
 * - aip://specs/{specId} - Modified OpenAPI specs
 *
 * Note: @platformatic/mcp uses exact URI matching for resources.
 * For dynamic URIs, we use query parameters (e.g., aip://findings?id=xxx)
 * or register resources dynamically when created.
 */

import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

import type {
  HandlerContext,
  ReadResourceResult,
} from '../types/mcp-context.js';

import { getFindingsStorage } from '../services/findings-storage.js';
import { getTempStorage } from '../services/temp-storage.js';

/**
 * Parse AIP resource URI to extract type and ID.
 * Supports formats:
 * - aip://findings/{id}
 * - aip://specs/{id}
 * - aip://findings?id={id}
 * - aip://specs?id={id}
 */
function parseAipUri(
  uri: string
): { type: 'findings' | 'specs'; id: string } | null {
  // Try path format: aip://findings/{id}
  const pathMatch = uri.match(/^aip:\/\/(findings|specs)\/(.+)$/);
  if (pathMatch) {
    return {
      type: pathMatch[1] as 'findings' | 'specs',
      id: pathMatch[2],
    };
  }

  // Try query format: aip://findings?id={id}
  try {
    const url = new URL(uri);
    const host = url.host || url.pathname.split('/')[0];
    if (host === 'findings' || host === 'specs') {
      const id = url.searchParams.get('id');
      if (id) {
        return { type: host as 'findings' | 'specs', id };
      }
    }
  } catch {
    // Not a valid URL format
  }

  return null;
}

// URI schema for findings resources
const FindingsUriSchema = Type.String({
  pattern: '^aip://findings/.+',
  description: 'URI for AIP review findings',
});

// URI schema for specs resources
const SpecsUriSchema = Type.String({
  pattern: '^aip://specs/.+',
  description: 'URI for modified OpenAPI specs',
});

/**
 * Register AIP resources with the Fastify instance.
 */
export function registerAipResources(fastify: FastifyInstance) {
  // Register findings resource
  fastify.mcpAddResource(
    {
      uriPattern: 'aip://findings/{reviewId}',
      name: 'AIP Review Findings',
      description:
        'Access cached AIP review findings by reviewId. May include code locations if correlated.',
      mimeType: 'application/json',
      uriSchema: FindingsUriSchema,
    },
    async (
      uri: string,
      _context: HandlerContext
    ): Promise<ReadResourceResult> => {
      const parsed = parseAipUri(uri);
      if (!parsed || parsed.type !== 'findings') {
        return {
          contents: [
            {
              uri,
              text: JSON.stringify({ error: `Invalid findings URI: ${uri}` }),
              mimeType: 'application/json',
            },
          ],
        };
      }

      const findingsStore = getFindingsStorage();
      const resource = await findingsStore.get(parsed.id);

      if (!resource) {
        return {
          contents: [
            {
              uri,
              text: JSON.stringify({
                error: 'Findings not found',
                reviewId: parsed.id,
              }),
              mimeType: 'application/json',
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: resource.content,
          },
        ],
      };
    }
  );

  // Register specs resource
  fastify.mcpAddResource(
    {
      uriPattern: 'aip://specs/{specId}',
      name: 'Modified OpenAPI Specs',
      description: 'Access modified OpenAPI specs by specId.',
      mimeType: 'application/octet-stream',
      uriSchema: SpecsUriSchema,
    },
    async (
      uri: string,
      _context: HandlerContext
    ): Promise<ReadResourceResult> => {
      const parsed = parseAipUri(uri);
      if (!parsed || parsed.type !== 'specs') {
        return {
          contents: [
            {
              uri,
              text: JSON.stringify({ error: `Invalid specs URI: ${uri}` }),
              mimeType: 'application/json',
            },
          ],
        };
      }

      const tempStore = getTempStorage();
      const resource = await tempStore.get(parsed.id);

      if (!resource) {
        return {
          contents: [
            {
              uri,
              text: JSON.stringify({
                error: 'Spec not found',
                specId: parsed.id,
              }),
              mimeType: 'application/json',
            },
          ],
        };
      }

      const mimeType =
        resource.contentType === 'yaml'
          ? 'application/x-yaml'
          : 'application/json';

      return {
        contents: [
          {
            uri,
            mimeType,
            text: resource.content,
          },
        ],
      };
    }
  );

  fastify.log.info('AIP resources registered');
}
