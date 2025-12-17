/**
 * AIP Review Tool
 *
 * Analyzes an OpenAPI spec against Google AIP guidelines.
 * Supports two input modes:
 * - specPath: Local file path (STDIO transport)
 * - specUrl: HTTP(S) URL to fetch spec (HTTP transport)
 *
 * Spec data is transferred to worker via SharedArrayBuffer for
 * zero-copy transfer. Parsing happens in the worker thread.
 */

import { z } from 'zod';
import { loadSpecRaw } from './spec-loader.js';
import { storeFindings } from '../services/findings-storage.js';
import { BaseFindingSchema } from '../types/extended-finding.js';
import type { ExtendedToolContext } from './types.js';
import type { WorkerTask } from './worker-pool.js';

// Zod schema for MCP SDK
export const ReviewInputSchema = z
  .object({
    specPath: z
      .string()
      .optional()
      .describe(
        'Path to local OpenAPI spec file (YAML/JSON). Preferred for STDIO transport.'
      ),
    specUrl: z
      .url()
      .optional()
      .describe(
        'URL to fetch OpenAPI spec from (HTTP/HTTPS). Works with remote HTTP transport.'
      ),
    strict: z
      .boolean()
      .optional()
      .default(false)
      .describe('Treat warnings as errors'),
    categories: z
      .array(z.string())
      .optional()
      .describe(
        'Only run rules from these categories (naming, pagination, errors, standard-methods, idempotency, filtering)'
      ),
    skipRules: z
      .array(z.string())
      .optional()
      .describe('Skip specific rule IDs (e.g., aip122/plural-resources)'),
  })
  .refine((data) => data.specPath || data.specUrl, {
    message: 'Either specPath or specUrl must be provided',
  });

export type ReviewInput = z.infer<typeof ReviewInputSchema>;

// Schema for structured review output (the actual data, not the MCP wrapper)
export const ReviewResultSchema = z.object({
  reviewId: z
    .string()
    .describe('Hash of spec content, use to retrieve cached findings'),
  findings: z.array(BaseFindingSchema),
  summary: z.object({
    total: z.number(),
    errors: z.number(),
    warnings: z.number(),
    suggestions: z.number(),
  }),
  specSource: z.string(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

// Schema for compact review output (returned to caller for token efficiency)
export const ReviewCompactOutputSchema = z.object({
  reviewId: z
    .string()
    .describe('Hash of spec content, use to retrieve cached findings'),
  specPath: z.string().describe('Path or URL of the reviewed spec'),
  specTitle: z.string().optional(),
  specVersion: z.string().optional(),
  summary: z.object({
    total: z.number(),
    errors: z.number(),
    warnings: z.number(),
    suggestions: z.number(),
  }),
  findingsUrl: z
    .string()
    .optional()
    .describe('Signed URL to download full findings (HTTP transport)'),
  findingsPath: z
    .string()
    .optional()
    .describe('File path to full findings (STDIO transport)'),
  expiresAt: z
    .string()
    .optional()
    .describe('ISO timestamp when URL/path expires'),
});

export type ReviewCompactOutput = z.infer<typeof ReviewCompactOutputSchema>;

/**
 * Create a review tool with the given context (worker pool).
 */
export function createReviewTool(context: ExtendedToolContext) {
  return {
    name: 'aip-review',
    description:
      'Analyze an OpenAPI spec against Google AIP guidelines. Returns a compact summary with reviewId and a link to full findings. Use findingsPath/findingsUrl to access detailed findings, or pass reviewId to aip-apply-fixes.',
    inputSchema: ReviewInputSchema,

    async execute(input: ReviewInput) {
      const { specPath, specUrl, strict, categories, skipRules } = input;

      // Load spec as raw buffer (no parsing on main thread)
      const loaded = await loadSpecRaw({ specPath, specUrl });
      if (!loaded) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'No spec provided. Use specPath or specUrl.',
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
          categories,
          skipRules,
        },
        specBuffer: sharedBuffer,
        contentType: loaded.contentType,
        sourcePath: loaded.sourcePath,
      };

      const result = await context.workerPool.execute(task);
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

      // TODO: validate result.data against ReviewResultSchema
      // Worker returns structured data with reviewId
      // Note: Library returns specPath, summary without total
      const resultData = result.data as {
        reviewId: string;
        specPath: string;
        specTitle?: string;
        specVersion?: string;
        findings: ReviewResult['findings'];
        summary: { errors: number; warnings: number; suggestions: number };
      };
      const {
        reviewId,
        findings,
        summary,
        specPath: reviewedSpecPath,
      } = resultData;

      // Calculate total from summary components
      const total = summary.errors + summary.warnings + summary.suggestions;

      // Cache findings for later use (e.g., by apply-fixes with reviewId)
      // Also returns storage info for compact response
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
        ...(stored.url && { findingsUrl: stored.url }),
        ...(stored.path && { findingsPath: stored.path }),
        expiresAt: new Date(stored.expiresAt).toISOString(),
      };

      // Build content with optional resource link
      const textContent = {
        type: 'text' as const,
        text: JSON.stringify(compactOutput, null, 2),
      };

      // Determine resource link URI
      let resourceUri: string | undefined;
      if (stored.url) {
        resourceUri = stored.url;
      } else if (stored.path) {
        resourceUri = `file://${stored.path}`;
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Findings storage unavailable',
              }),
            },
          ],
          isError: true,
        };
      }

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
    },
  };
}
