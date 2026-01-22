/**
 * MCP Resource Registration
 *
 * Registers AIP resources with @platformatic/mcp using:
 * 1. mcpAddResource with uriSchema for query-param based resource access
 * 2. Native resources/list returns registered resource definitions
 * 3. Custom subscription handlers using ResourceSubscriptionBroker
 *
 * Resources exposed (query param format):
 * - aip://findings?id={reviewId} - AIP review findings
 * - aip://specs?id={specId} - Modified OpenAPI specs
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
 * Parse AIP resource URI to extract type and ID from query params.
 * Format: aip://findings?id={id} or aip://specs?id={id}
 */
function parseAipUri(
  uri: string
): { type: 'findings' | 'specs'; id: string } | null {
  try {
    const url = new URL(uri);
    // For aip:// URIs, the "host" is the resource type (findings/specs)
    const resourceType = url.host;
    if (resourceType === 'findings' || resourceType === 'specs') {
      const id = url.searchParams.get('id');
      if (id) {
        return { type: resourceType, id };
      }
    }
  } catch {
    // Not a valid URL format
  }
  return null;
}

// URI schema for findings resources - validates query param format
const FindingsUriSchema = Type.String({
  pattern: '^aip://findings\\?id=.+',
  description: 'URI for AIP review findings with id query parameter',
});

// URI schema for specs resources - validates query param format
const SpecsUriSchema = Type.String({
  pattern: '^aip://specs\\?id=.+',
  description: 'URI for modified OpenAPI specs with id query parameter',
});

/**
 * Register AIP resources with the Fastify instance.
 */
export function registerAipResources(fastify: FastifyInstance) {
  // Register findings resource with query param pattern
  fastify.mcpAddResource(
    {
      uriPattern: 'aip://findings',
      name: 'AIP Review Findings',
      description:
        'Access cached AIP review findings. Use ?id={reviewId} to read specific findings.',
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
              text: JSON.stringify({
                error: `Invalid findings URI: ${uri}. Use aip://findings?id={reviewId}`,
              }),
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

  // Register specs resource with query param pattern
  fastify.mcpAddResource(
    {
      uriPattern: 'aip://specs',
      name: 'Modified OpenAPI Specs',
      description:
        'Access modified OpenAPI specs. Use ?id={specId} to read specific spec.',
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
              text: JSON.stringify({
                error: `Invalid specs URI: ${uri}. Use aip://specs?id={specId}`,
              }),
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

  // Register subscription handlers using the broker
  fastify.mcpSetResourcesSubscribeHandler(async (params, context) => {
    const sessionId = context.sessionId;
    if (!sessionId) {
      throw new Error('Session ID required for subscriptions');
    }
    // TODO: Handle subscription logic
    return {};
  });

  fastify.mcpSetResourcesUnsubscribeHandler(async (params, context) => {
    const sessionId = context.sessionId;
    if (!sessionId) {
      throw new Error('Session ID required for subscriptions');
    }
    // TODO: Handle unsubscription logic
    return {};
  });

  fastify.log.info('AIP resources registered');
}
