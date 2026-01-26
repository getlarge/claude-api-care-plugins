/**
 * TypeBox Schemas for MCP Tools
 *
 * Centralized schemas for tool input/output validation.
 * Migrated from Zod to TypeBox for @platformatic/mcp compatibility.
 */

import { Type, type Static } from '@sinclair/typebox';

// =============================================================================
// Common Schemas
// =============================================================================

export const SeveritySchema = Type.Union([
  Type.Literal('error'),
  Type.Literal('warning'),
  Type.Literal('suggestion'),
]);
export type Severity = Static<typeof SeveritySchema>;

export const FrameworkSchema = Type.Union([
  Type.Literal('nestjs'),
  Type.Literal('fastify'),
  Type.Literal('express'),
  Type.Literal('unknown'),
]);
export type Framework = Static<typeof FrameworkSchema>;

export const CorrelationLevelSchema = Type.Union([
  Type.Literal('minimal'),
  Type.Literal('moderate'),
  Type.Literal('thorough'),
]);
export type CorrelationLevel = Static<typeof CorrelationLevelSchema>;

// =============================================================================
// Spec Change Schema (from baume-review findings)
// =============================================================================

export const SpecChangeSchema = Type.Object({
  operation: Type.Union([
    Type.Literal('rename-key'),
    Type.Literal('set'),
    Type.Literal('add'),
    Type.Literal('remove'),
    Type.Literal('merge'),
  ]),
  path: Type.String(),
  from: Type.Optional(Type.String()),
  to: Type.Optional(Type.String()),
  value: Type.Optional(Type.Unknown()),
});
export type SpecChange = Static<typeof SpecChangeSchema>;

// =============================================================================
// Code Location Schemas
// =============================================================================

export const CodeLocationTypeSchema = Type.Union([
  Type.Literal('controller'),
  Type.Literal('handler'),
  Type.Literal('route'),
  Type.Literal('schema'),
  Type.Literal('dto'),
  Type.Literal('service'),
  Type.Literal('decorator'),
]);
export type CodeLocationType = Static<typeof CodeLocationTypeSchema>;

export const ConfidenceSchema = Type.Union([
  Type.Literal('high'),
  Type.Literal('medium'),
  Type.Literal('low'),
]);
export type Confidence = Static<typeof ConfidenceSchema>;

export const CodeLocationSchema = Type.Object({
  file: Type.String(),
  line: Type.Number(),
  type: CodeLocationTypeSchema,
  confidence: ConfidenceSchema,
  snippet: Type.Optional(Type.String()),
  reasoning: Type.Optional(Type.String()),
});
export type CodeLocation = Static<typeof CodeLocationSchema>;

// =============================================================================
// Base Finding Schema
// =============================================================================

export const BaseFindingSchema = Type.Object({
  ruleId: Type.String(),
  severity: SeveritySchema,
  category: Type.String(),
  path: Type.String(),
  message: Type.String(),
  aip: Type.Optional(Type.String()),
  suggestion: Type.Optional(Type.String()),
  context: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  fix: Type.Optional(
    Type.Object({
      type: Type.String(),
      jsonPath: Type.String(),
      specChanges: Type.Array(SpecChangeSchema),
    })
  ),
  codeLocations: Type.Optional(Type.Array(CodeLocationSchema)),
});
export type BaseFinding = Static<typeof BaseFindingSchema>;

// =============================================================================
// Review Tool Schemas
// =============================================================================

export const ReviewInputSchema = Type.Object({
  specPath: Type.Optional(
    Type.String({
      description:
        'Path to local OpenAPI spec file (YAML/JSON). Preferred for STDIO transport.',
    })
  ),
  specUrl: Type.Optional(
    Type.String({
      format: 'uri',
      description:
        'URL to fetch OpenAPI spec from (HTTP/HTTPS). Works with remote HTTP transport.',
    })
  ),
  strict: Type.Optional(
    Type.Boolean({
      default: false,
      description: 'Treat warnings as errors',
    })
  ),
  lenient: Type.Optional(
    Type.Boolean({
      default: false,
      description:
        'Skip strict OpenAPI schema validation. Use when specs have minor schema issues but are still processable. The server will automatically fallback to lenient mode if strict validation fails.',
    })
  ),
  categories: Type.Optional(
    Type.Array(Type.String(), {
      description:
        'Only run rules from these categories (naming, pagination, errors, standard-methods, idempotency, filtering)',
    })
  ),
  skipRules: Type.Optional(
    Type.Array(Type.String(), {
      description: 'Skip specific rule IDs (e.g., aip122/plural-resources)',
    })
  ),
});
export type ReviewInput = Static<typeof ReviewInputSchema>;

export const ReviewSummarySchema = Type.Object({
  total: Type.Number(),
  errors: Type.Number(),
  warnings: Type.Number(),
  suggestions: Type.Number(),
});

export const ReviewCompactOutputSchema = Type.Object({
  reviewId: Type.String({
    description: 'Hash of spec content, use to retrieve cached findings',
  }),
  specPath: Type.String({ description: 'Path or URL of the reviewed spec' }),
  specTitle: Type.Optional(Type.String()),
  specVersion: Type.Optional(Type.String()),
  summary: ReviewSummarySchema,
  lenientMode: Type.Optional(
    Type.Boolean({
      description:
        'True if review was done in lenient mode (strict OpenAPI validation was skipped)',
    })
  ),
  lenientReason: Type.Optional(
    Type.String({
      description:
        'Reason for lenient mode (explicit request or auto-fallback)',
    })
  ),
  findingsUrl: Type.Optional(
    Type.String({
      description: 'Signed URL to download full findings (HTTP transport)',
    })
  ),
  findingsPath: Type.Optional(
    Type.String({
      description: 'File path to full findings (STDIO transport)',
    })
  ),
  expiresAt: Type.Optional(
    Type.String({ description: 'ISO timestamp when URL/path expires' })
  ),
});
export type ReviewCompactOutput = Static<typeof ReviewCompactOutputSchema>;

// =============================================================================
// List Rules Tool Schemas
// =============================================================================

export const ListRulesInputSchema = Type.Object({
  aip: Type.Optional(
    Type.Number({ description: 'Filter by AIP number (e.g., 122, 158)' })
  ),
  category: Type.Optional(
    Type.String({
      description:
        'Filter by category (naming, pagination, errors, standard-methods, idempotency, filtering)',
    })
  ),
});
export type ListRulesInput = Static<typeof ListRulesInputSchema>;

export const RuleInfoSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  aip: Type.Optional(Type.String()),
  severity: SeveritySchema,
  category: Type.String(),
  description: Type.String(),
});

export const ListRulesOutputSchema = Type.Object({
  rules: Type.Array(RuleInfoSchema),
  count: Type.Number(),
});
export type ListRulesOutput = Static<typeof ListRulesOutputSchema>;

// =============================================================================
// Get Info Tool Schemas
// =============================================================================

export const GetInfoInputSchema = Type.Object({
  aip: Type.Number({
    description:
      'AIP number (e.g., 122 for Resource Names, 158 for Pagination)',
  }),
});
export type GetInfoInput = Static<typeof GetInfoInputSchema>;

export const GetInfoOutputSchema = Type.Object({
  aip: Type.String(),
  title: Type.String(),
  summary: Type.String(),
  category: Type.Optional(Type.String()),
  url: Type.String(),
  linterDocs: Type.String(),
});
export type GetInfoOutput = Static<typeof GetInfoOutputSchema>;

// =============================================================================
// Apply Fixes Tool Schemas
// =============================================================================

export const ApplyFixesInputSchema = Type.Object({
  specPath: Type.Optional(
    Type.String({
      description:
        'Path to local OpenAPI spec file (YAML/JSON). Preferred for STDIO transport.',
    })
  ),
  specUrl: Type.Optional(
    Type.String({
      format: 'uri',
      description:
        'URL to fetch OpenAPI spec from (HTTP/HTTPS). Note: cannot write back to URL.',
    })
  ),
  reviewId: Type.String({
    description:
      'Review ID from baume-review to retrieve cached findings for applying fixes.',
  }),
  dryRun: Type.Optional(
    Type.Boolean({
      default: false,
      description:
        'Validate changes without modifying the spec or writing to file',
    })
  ),
  writeBack: Type.Optional(
    Type.Boolean({
      default: false,
      description:
        'Write modified spec back to specPath (only works with specPath, ignored for specUrl)',
    })
  ),
});
export type ApplyFixesInput = Static<typeof ApplyFixesInputSchema>;

export const ChangeLogEntrySchema = Type.Object({
  change: Type.Object({
    operation: Type.Union([
      Type.Literal('rename-key'),
      Type.Literal('set'),
      Type.Literal('add'),
      Type.Literal('remove'),
      Type.Literal('merge'),
    ]),
    path: Type.String(),
    from: Type.Optional(Type.String()),
    to: Type.Optional(Type.String()),
    value: Type.Optional(Type.Unknown()),
  }),
  applied: Type.Boolean(),
  error: Type.Optional(Type.String()),
});

export const FixResultSchema = Type.Object({
  ruleId: Type.String(),
  applied: Type.Boolean(),
  changes: Type.Array(ChangeLogEntrySchema),
});

export const ApplyFixesOutputSchema = Type.Object({
  results: Type.Array(FixResultSchema),
  summary: Type.Object({
    total: Type.Number(),
    applied: Type.Number(),
    failed: Type.Number(),
    changes: Type.Number(),
  }),
  errors: Type.Array(Type.String()),
  specSource: Type.String(),
  writtenTo: Type.Optional(Type.String()),
  modifiedSpecUrl: Type.Optional(Type.String()),
  modifiedSpecPath: Type.Optional(Type.String()),
  expiresAt: Type.Optional(Type.String()),
});
export type ApplyFixesOutput = Static<typeof ApplyFixesOutputSchema>;

// =============================================================================
// Correlate Tool Schemas
// =============================================================================

export const CorrelateInputSchema = Type.Object({
  reviewId: Type.String({
    description:
      'Review ID from baume-review to retrieve cached findings for correlation.',
  }),
  specPath: Type.Optional(
    Type.String({
      description: 'Path to the OpenAPI spec file (for context extraction)',
    })
  ),
  projectRoot: Type.Optional(
    Type.String({
      description: 'Root directory of the project to search for code',
    })
  ),
  framework: Type.Optional(
    Type.Union(
      [
        Type.Literal('nestjs'),
        Type.Literal('fastify'),
        Type.Literal('express'),
        Type.Literal('unknown'),
      ],
      {
        description:
          'Framework hint to improve code location accuracy (nestjs, fastify, express)',
      }
    )
  ),
  apiKey: Type.Optional(
    Type.String({
      description:
        'Anthropic API key for Agent SDK fallback. Falls back to X-Anthropic-Key header, ANTHROPIC_API_KEY, or CLAUDE_CODE_OAUTH_TOKEN env vars.',
    })
  ),
  correlationLevel: Type.Optional(
    Type.Union(
      [
        Type.Literal('minimal'),
        Type.Literal('moderate'),
        Type.Literal('thorough'),
      ],
      {
        default: 'moderate',
        description:
          'How aggressively to correlate: minimal=errors only, moderate=errors+warnings, thorough=all',
      }
    )
  ),
});
export type CorrelateInput = Static<typeof CorrelateInputSchema>;

export const CorrelateOutputSchema = Type.Object({
  reviewId: Type.String(),
  specPath: Type.String(),
  framework: FrameworkSchema,
  summary: Type.Object({
    totalFindings: Type.Number(),
    correlated: Type.Number(),
    notFound: Type.Number(),
  }),
  findingsUrl: Type.Optional(Type.String()),
  findingsPath: Type.Optional(Type.String()),
  expiresAt: Type.String(),
});
export type CorrelateOutput = Static<typeof CorrelateOutputSchema>;

// =============================================================================
// Extended Finding Schema (for correlation results)
// =============================================================================

export const SpecContextSchema = Type.Object({
  method: Type.String(),
  path: Type.String(),
  operationId: Type.Optional(Type.String()),
  summary: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});
export type SpecContext = Static<typeof SpecContextSchema>;

export const CodeDiffSchema = Type.Object({
  file: Type.String(),
  diff: Type.String(),
  description: Type.String(),
});
export type CodeDiff = Static<typeof CodeDiffSchema>;

export const SuggestedDiffsSchema = Type.Object({
  specDiff: Type.Optional(Type.String()),
  codeDiffs: Type.Optional(Type.Array(CodeDiffSchema)),
});
export type SuggestedDiffs = Static<typeof SuggestedDiffsSchema>;

export const ExtendedFindingSchema = Type.Object({
  finding: BaseFindingSchema,
  specContext: SpecContextSchema,
  codeLocations: Type.Array(CodeLocationSchema),
  suggestedDiffs: Type.Optional(SuggestedDiffsSchema),
});
export type ExtendedFinding = Static<typeof ExtendedFindingSchema>;
