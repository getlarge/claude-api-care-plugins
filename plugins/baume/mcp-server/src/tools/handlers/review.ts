/**
 * AIP Review Handler
 *
 * Analyzes an OpenAPI spec against Google AIP guidelines.
 * Adapted for @platformatic/mcp HandlerContext.
 *
 * Supports two input modes via spec union:
 * - spec.path: Local file path (STDIO transport)
 * - spec.url: HTTP(S) URL to fetch spec (HTTP transport)
 *
 * Spec data is transferred to worker via SharedArrayBuffer for
 * zero-copy transfer. Parsing happens in the worker thread.
 */

import type { FastifyInstance } from 'fastify';
import type {
  HandlerContext,
  CallToolResult,
} from '../../types/mcp-context.js';

import { loadSpecRaw } from '../spec-loader.js';
import { storeFindings } from '../../services/findings-storage.js';
import { getSubscriptionStore } from '../../services/subscription-store/index.js';
import type { WorkerPool, WorkerTask } from '../worker-pool.js';
import type {
  ReviewInput,
  ReviewCompactOutput,
  BaseFinding,
} from '../../schemas/index.js';

interface ReviewHandlerDeps {
  workerPool: WorkerPool;
  fastify: FastifyInstance;
  context: HandlerContext;
}

interface ReviewResultData {
  reviewId: string;
  specPath: string;
  specTitle?: string;
  specVersion?: string;
  findings: BaseFinding[];
  summary: { errors: number; warnings: number; suggestions: number };
  metadata?: {
    lenientMode?: boolean;
    lenientReason?: string;
  };
}

/**
 * Execute the baume-review tool.
 */
export async function executeReview(
  params: ReviewInput,
  deps: ReviewHandlerDeps
): Promise<CallToolResult> {
  const { workerPool, fastify } = deps;
  // Extract spec source from union type (spec.path or spec.url)
  const specPath = 'path' in params.spec ? params.spec.path : undefined;
  const specUrl = 'url' in params.spec ? params.spec.url : undefined;
  const { strict, lenient, categories, skipRules } = params;

  // Load spec as raw buffer (no parsing on main thread)
  let loaded;
  try {
    loaded = await loadSpecRaw({ specPath, specUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load spec';
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ error: message }) },
      ],
      isError: true,
    };
  }

  if (!loaded) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'No spec provided. Use spec.path or spec.url.',
          }),
        },
      ],
      isError: true,
    };
  }

  // Copy to SharedArrayBuffer for zero-copy transfer to worker
  const sharedBuffer = new SharedArrayBuffer(loaded.buffer.byteLength);
  new Uint8Array(sharedBuffer).set(new Uint8Array(loaded.buffer));

  const task: WorkerTask = {
    type: 'review',
    payload: {
      strict,
      lenient,
      categories,
      skipRules,
    },
    specBuffer: sharedBuffer,
    contentType: loaded.contentType,
    sourcePath: loaded.sourcePath,
  };

  const result = await workerPool.execute(task);
  if (!result.success) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: result.error }),
        },
      ],
      isError: true,
    };
  }

  const resultData = result.data as ReviewResultData;
  const {
    reviewId,
    findings,
    summary,
    specPath: reviewedSpecPath,
  } = resultData;

  // Calculate total from summary components
  const total = summary.errors + summary.warnings + summary.suggestions;

  const resourceUri = `baume://findings?id=${reviewId}`;

  // Cache findings for later use (e.g., by apply-fixes with reviewId)
  let stored: {
    id: string;
    url?: string;
    path?: string;
    expiresAt: number;
  };
  try {
    stored = await storeFindings(reviewId, {
      findings,
      summary: { ...summary, total },
      specSource: reviewedSpecPath,
    });

    // Notify subscribers of updated findings resource
    const subscriptionStore = getSubscriptionStore();
    const subscribers = await subscriptionStore.getSubscribers(resourceUri);
    for (const sessionId of subscribers) {
      fastify.mcpSendToSession(sessionId, {
        jsonrpc: '2.0',
        method: 'notifications/resources/updated',
        params: { uri: resourceUri },
      });
    }
  } catch {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Failed to store findings for reviewId caching',
          }),
        },
      ],
      isError: true,
    };
  }

  // Build compact output (token-efficient response)
  const compactOutput: ReviewCompactOutput = {
    reviewId,
    specPath: reviewedSpecPath,
    ...(resultData.specTitle && { specTitle: resultData.specTitle }),
    ...(resultData.specVersion && { specVersion: resultData.specVersion }),
    summary: {
      total,
      errors: summary.errors,
      warnings: summary.warnings,
      suggestions: summary.suggestions,
    },
    ...(resultData.metadata?.lenientMode && {
      lenientMode: true,
      lenientReason: resultData.metadata.lenientReason,
    }),
    expiresAt: new Date(stored.expiresAt).toISOString(),
  };

  // Build content with optional resource link
  const textContent = {
    type: 'text' as const,
    text: JSON.stringify(compactOutput, null, 2),
  };

  return {
    content: [
      textContent,
      {
        type: 'resource_link' as const,
        uri: resourceUri,
        name: `findings-${reviewId}.json`,
        description: 'Full AIP review findings',
        mimeType: 'application/json',
      },
    ],
    structuredContent: compactOutput,
  };
}
