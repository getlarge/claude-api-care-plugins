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
import type { ToolContext } from './types.js';
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
  findings: z.array(
    z.object({
      ruleId: z.string(),
      severity: z.enum(['error', 'warning', 'suggestion']),
      category: z.string(),
      path: z.string(),
      message: z.string(),
      aip: z.string().optional(),
      suggestion: z.string().optional(),
      context: z.record(z.string(), z.unknown()).optional(),
      fix: z
        .object({
          type: z.string(),
          jsonPath: z.string(),
          specChanges: z.array(
            z.object({
              operation: z.enum([
                'rename-key',
                'set',
                'add',
                'remove',
                'merge',
              ]),
              path: z.string(),
              from: z.string().optional(),
              to: z.string().optional(),
              value: z.unknown().optional(),
            })
          ),
        })
        .optional(),
    })
  ),
  summary: z.object({
    total: z.number(),
    errors: z.number(),
    warnings: z.number(),
    suggestions: z.number(),
  }),
  specSource: z.string(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

/**
 * Create a review tool with the given context (worker pool).
 */
export function createReviewTool(context: ToolContext) {
  return {
    name: 'aip-review',
    description:
      'Analyze an OpenAPI spec against Google AIP guidelines. Provide spec via: specPath (local file) or specUrl (HTTP URL). Returns findings with severity, rule ID, path, message, and fix suggestions.',
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

      // Parse worker result for structuredContent
      const resultData = JSON.parse(result.data as string) as ReviewResult;

      return {
        content: [
          {
            type: 'text' as const,
            text: result.data as string,
          },
        ],
        structuredContent: resultData,
      };
    },
  };
}
