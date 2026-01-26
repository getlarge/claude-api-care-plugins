/**
 * Extended Finding Types
 *
 * Types for correlating AIP review findings with code locations.
 * Used by the aip-code-correlator skill and future aip-correlate MCP tool.
 */

import { z } from 'zod';

// =============================================================================
// Spec Change Types (from aip-review findings)
// =============================================================================

export const SpecChangeSchema = z.object({
  operation: z.enum(['rename-key', 'set', 'add', 'remove', 'merge']),
  path: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  value: z.unknown().optional(),
});

export type SpecChange = z.infer<typeof SpecChangeSchema>;

// =============================================================================
// Base Finding (from aip-review, unchanged)
// =============================================================================

export const BaseFindingSchema = z.object({
  ruleId: z.string(),
  severity: z.enum(['error', 'warning', 'suggestion']),
  category: z.string(),
  path: z.string(), // e.g., "GET /users/{id}"
  message: z.string(),
  aip: z.string().optional(),
  suggestion: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(), // Additional context from the rule
  fix: z
    .object({
      type: z.string(),
      jsonPath: z.string(),
      specChanges: z.array(SpecChangeSchema),
    })
    .optional(),
  codeLocations: z.array(z.lazy(() => CodeLocationSchema)).optional(), // Allow findings to have code locations after correlation
});

export type BaseFinding = z.infer<typeof BaseFindingSchema>;

// =============================================================================
// Spec Context (extracted from OpenAPI spec for agent context)
// =============================================================================

export const SpecContextSchema = z.object({
  method: z.string(), // GET, POST, PATCH, DELETE
  path: z.string(), // /users/{id}
  operationId: z.string().optional(), // getUserById
  summary: z.string().optional(), // "Get a user by ID"
  tags: z.array(z.string()).optional(), // ["users"]
});

export type SpecContext = z.infer<typeof SpecContextSchema>;

// =============================================================================
// Code Location (populated by aip-code-locator agent)
// =============================================================================

export const CodeLocationTypeSchema = z.enum([
  'controller',
  'handler',
  'route',
  'schema',
  'dto',
  'service',
  'decorator',
]);

export type CodeLocationType = z.infer<typeof CodeLocationTypeSchema>;

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

export type Confidence = z.infer<typeof ConfidenceSchema>;

export const CodeLocationSchema = z.object({
  file: z.string(), // src/users/users.controller.ts
  line: z.number(), // 42
  type: CodeLocationTypeSchema,
  confidence: ConfidenceSchema,
  snippet: z.string().optional(), // Few lines of context
  reasoning: z.string().optional(), // Why this location was chosen
});

export type CodeLocation = z.infer<typeof CodeLocationSchema>;

// =============================================================================
// Code Diff (suggested changes for obvious fixes)
// =============================================================================

export const CodeDiffSchema = z.object({
  file: z.string(),
  diff: z.string(), // Unified diff format
  description: z.string(), // What this change does
});

export type CodeDiff = z.infer<typeof CodeDiffSchema>;

export const SuggestedDiffsSchema = z.object({
  specDiff: z.string().optional(), // Unified diff format for OpenAPI spec
  codeDiffs: z.array(CodeDiffSchema).optional(),
});

export type SuggestedDiffs = z.infer<typeof SuggestedDiffsSchema>;

// =============================================================================
// Extended Finding (finding + code correlation)
// =============================================================================

export const ExtendedFindingSchema = z.object({
  finding: BaseFindingSchema,
  specContext: SpecContextSchema,
  codeLocations: z.array(CodeLocationSchema),
  suggestedDiffs: SuggestedDiffsSchema.optional(),
});

export type ExtendedFinding = z.infer<typeof ExtendedFindingSchema>;

// =============================================================================
// Correlation Result (full output of correlation process)
// =============================================================================

export const CorrelationSummarySchema = z.object({
  totalFindings: z.number(),
  correlated: z.number(),
  notFound: z.number(),
});

export type CorrelationSummary = z.infer<typeof CorrelationSummarySchema>;

export const FrameworkSchema = z.enum([
  'nestjs',
  'fastify',
  'express',
  'unknown',
]);

export type Framework = z.infer<typeof FrameworkSchema>;

export const CorrelationResultSchema = z.object({
  generatedAt: z.string(), // ISO timestamp
  reviewPath: z.string().optional(),
  specPath: z.string(),
  framework: FrameworkSchema,
  summary: CorrelationSummarySchema,
  extendedFindings: z.array(ExtendedFindingSchema),
});

export type CorrelationResult = z.infer<typeof CorrelationResultSchema>;
