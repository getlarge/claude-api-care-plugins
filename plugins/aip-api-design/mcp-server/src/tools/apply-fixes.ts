/**
 * Apply Fixes Tool
 *
 * Applies suggested fixes to an OpenAPI spec.
 * Supports three input modes for the spec:
 * - specPath: Local file path (STDIO transport only)
 * - specUrl: HTTP(S) URL to fetch spec (works with remote HTTP transport)
 * - spec: Inline JSON object (fallback, inefficient for large specs)
 *
 * For token efficiency, modified specs are stored temporarily and a
 * signed URL is returned instead of the full spec content.
 */

import { z } from 'zod';
import { OpenAPIFixer } from '@getlarge/aip-openapi-reviewer';
import type { Finding } from '@getlarge/aip-openapi-reviewer/types';
import { loadSpec, writeSpecToPath } from './spec-loader.js';
import { getTempStorage } from '../services/temp-storage.js';

const SpecChangeSchema = z.object({
  operation: z.enum(['rename-key', 'set', 'add', 'remove', 'merge']),
  path: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  value: z.unknown().optional(),
});

const FixSchema = z.object({
  type: z.string(),
  jsonPath: z.string(),
  specChanges: z.array(SpecChangeSchema),
});

const FindingWithFixSchema = z.object({
  ruleId: z.string(),
  severity: z.enum(['error', 'warning', 'suggestion']),
  category: z.string(),
  path: z.string(),
  message: z.string(),
  aip: z.string().optional(),
  suggestion: z.string().optional(),
  fix: FixSchema.optional(),
});

export const ApplyFixesInputSchema = z
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
        'URL to fetch OpenAPI spec from (HTTP/HTTPS). Note: cannot write back to URL.'
      ),
    spec: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        'OpenAPI specification as inline JSON object. Use specPath or specUrl instead for large specs.'
      ),
    findings: z
      .array(FindingWithFixSchema)
      .describe(
        'Array of finding objects from aip-review (only those with fix property will be applied)'
      ),
    dryRun: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Validate changes without modifying the spec or writing to file'
      ),
    writeBack: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'Write modified spec back to specPath (only works with specPath, ignored for specUrl/spec)'
      ),
  })
  .refine((data) => data.specPath || data.specUrl || data.spec, {
    message: 'One of specPath, specUrl, or spec must be provided',
  });

export type ApplyFixesInput = z.infer<typeof ApplyFixesInputSchema>;

export const applyFixesTool = {
  name: 'aip-apply-fixes',
  description:
    'Apply suggested fixes to an OpenAPI spec. Provide spec via: specPath (local file), specUrl (HTTP URL), or spec (inline JSON). Use writeBack=true with specPath to save to disk. Returns a signed URL to download the modified spec (valid for 5 minutes).',
  inputSchema: ApplyFixesInputSchema,

  async execute(input: ApplyFixesInput) {
    const { specPath, specUrl, spec, findings, dryRun, writeBack } = input;

    const loaded = await loadSpec({ specPath, specUrl, spec });
    if (!loaded) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'No spec provided. Use specPath, specUrl, or spec.',
            }),
          },
        ],
        isError: true,
      };
    }

    const fixer = new OpenAPIFixer(loaded.spec, { dryRun });

    // Apply each finding that has a fix
    const results = fixer.applyFixes(findings as unknown as Finding[]);
    const summary = fixer.getSummary();
    const modifiedSpec = fixer.getSpec();
    const errors = fixer.getErrors();

    // Write back to file if requested and using specPath
    let writtenTo: string | undefined;
    if (writeBack && specPath && !dryRun) {
      await writeSpecToPath(modifiedSpec as Record<string, unknown>, specPath);
      writtenTo = specPath;
    }

    // Store modified spec and get signed URL (token efficiency)
    const tempStorage = getTempStorage();
    const contentType =
      loaded.sourcePath.endsWith('.yaml') || loaded.sourcePath.endsWith('.yml')
        ? 'yaml'
        : 'json';

    const stored = await tempStorage.store(
      modifiedSpec as Record<string, unknown>,
      {
        contentType,
        filename: `fixed-${Date.now()}.${contentType === 'yaml' ? 'yaml' : 'json'}`,
      }
    );

    // Build response without full spec content
    const response: Record<string, unknown> = {
      results,
      summary,
      errors,
      specSource: loaded.sourcePath,
    };

    if (writtenTo) {
      response.writtenTo = writtenTo;
    }

    // Include URL or path to download the modified spec
    if (stored.url) {
      response.modifiedSpecUrl = stored.url;
      response.expiresAt = new Date(stored.expiresAt).toISOString();
    } else if (stored.path) {
      response.modifiedSpecPath = stored.path;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  },
};
