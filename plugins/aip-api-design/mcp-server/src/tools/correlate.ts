/**
 * AIP Correlate Tool
 *
 * Correlates AIP review findings with code locations using LLM reasoning.
 * Supports two execution modes:
 * 1. MCP Sampling - Uses client's LLM capabilities via extra.sendRequest
 * 2. Agent SDK Fallback - Uses Claude Agent SDK when sampling is unavailable
 *
 * The sampling approach uses sendRequest from RequestHandlerExtra as suggested
 * in MCP SDK Issue #907 comments for HTTP transport compatibility.
 */

import { z } from 'zod';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  CreateMessageResultSchema,
  type ServerRequest,
  type ServerNotification,
  type CreateMessageRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { getFindings, storeFindings } from '../services/findings-storage.js';
import { resolveApiKey, withApiKey } from '../services/api-key.js';
import { createLogger, type Logger } from '../services/logging.js';
import {
  parseJsonResponse,
  extractTextContent,
  collectAgentText,
} from '../services/llm-response.js';
import { buildLocatorPrompt, type Framework } from '../prompts/code-locator.js';
import { processMapBatched } from '../utils/batch.js';
import {
  FrameworkSchema,
  CodeLocationTypeSchema,
  type ExtendedFinding,
  type BaseFinding,
  type CodeLocation,
  type CodeLocationType,
  type SpecContext,
} from '../types/extended-finding.js';
import type { ExtendedToolContext } from './types.js';
import { StoreResult } from '../services/temp-storage.js';

// =============================================================================
// Input/Output Schemas
// =============================================================================

export const CorrelateInputSchema = z.object({
  reviewId: z
    .string()
    .describe(
      'Review ID from aip-review to retrieve cached findings for correlation.'
    ),
  specPath: z
    .string()
    .optional()
    .describe('Path to the OpenAPI spec file (for context extraction)'),
  projectRoot: z
    .string()
    .optional()
    .describe('Root directory of the project to search for code'),
  framework: FrameworkSchema.optional().describe(
    'Framework hint to improve code location accuracy (nestjs, fastify, express)'
  ),
  apiKey: z
    .string()
    .optional()
    .describe(
      'Anthropic API key for Agent SDK fallback. Falls back to X-Anthropic-Key header, ANTHROPIC_API_KEY, or CLAUDE_CODE_OAUTH_TOKEN env vars.'
    ),
  correlationLevel: z
    .enum(['minimal', 'moderate', 'thorough'])
    .optional()
    .default('moderate')
    .describe(
      'How aggressively to correlate: minimal=errors only, moderate=errors+warnings, thorough=all'
    ),
});

export type CorrelateInput = z.infer<typeof CorrelateInputSchema>;

// Compact output schema for correlation results
export const CorrelateOutputSchema = z.object({
  reviewId: z.string(),
  specPath: z.string(),
  framework: FrameworkSchema,
  summary: z.object({
    totalFindings: z.number(),
    correlated: z.number(),
    notFound: z.number(),
  }),
  findingsUrl: z.string().optional(),
  findingsPath: z.string().optional(),
  expiresAt: z.string(),
});

export type CorrelateOutput = z.infer<typeof CorrelateOutputSchema>;

// Type for the extra context passed to tool handlers
type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

// =============================================================================
// Finding Processing
// =============================================================================

type CorrelationLevel = 'minimal' | 'moderate' | 'thorough';

/**
 * Filter findings based on correlation level.
 */
function filterFindings(
  findings: BaseFinding[],
  level: CorrelationLevel
): BaseFinding[] {
  switch (level) {
    case 'minimal':
      return findings.filter((f) => f.severity === 'error');
    case 'moderate':
      return findings.filter(
        (f) => f.severity === 'error' || f.severity === 'warning'
      );
    case 'thorough':
      return findings;
  }
}

/**
 * Extract spec context from a finding path (e.g., "GET /users/{id}").
 */
function extractSpecContext(finding: BaseFinding): SpecContext {
  const pathMatch = finding.path.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
  if (pathMatch) {
    return {
      method: pathMatch[1].toUpperCase(),
      path: pathMatch[2],
    };
  }
  return {
    method: 'GET',
    path: finding.path,
  };
}

/**
 * Deduplicate findings by method+path to avoid correlating the same endpoint multiple times.
 */
function dedupeByOperation(
  findings: BaseFinding[]
): Map<string, BaseFinding[]> {
  const operationMap = new Map<string, BaseFinding[]>();

  for (const finding of findings) {
    const ctx = extractSpecContext(finding);
    const key = `${ctx.method} ${ctx.path}`;
    const existing = operationMap.get(key) ?? [];
    existing.push(finding);
    operationMap.set(key, existing);
  }

  return operationMap;
}

// =============================================================================
// Code Location Response Parsing
// =============================================================================

/**
 * Parse and validate CodeLocationType from LLM response.
 */
function parseLocationType(type: string | undefined): CodeLocationType {
  const result = CodeLocationTypeSchema.safeParse(type);
  return result.success ? result.data : 'controller';
}

/**
 * Parse LLM response to extract CodeLocation.
 */
function parseLocationResponse(responseText: string): CodeLocation | null {
  const parsed = parseJsonResponse<{
    file?: string | null;
    line?: number;
    type?: string;
    confidence?: string;
    snippet?: string;
    reasoning?: string;
  }>(responseText);

  if (!parsed?.file) {
    return null;
  }

  return {
    file: parsed.file,
    line: parsed.line ?? 0,
    type: parseLocationType(parsed.type),
    confidence: (parsed.confidence as 'high' | 'medium' | 'low') ?? 'medium',
    snippet: parsed.snippet,
    reasoning: parsed.reasoning,
  };
}

// =============================================================================
// Code Location via MCP Sampling
// =============================================================================

/**
 * Try to locate code using MCP sampling via sendRequest.
 */
async function locateViaSampling(
  extra: ToolExtra,
  method: string,
  path: string,
  framework: Framework,
  projectRoot: string,
  operationId?: string
): Promise<CodeLocation | null> {
  const prompt = buildLocatorPrompt({
    method,
    path,
    framework,
    projectRoot,
    operationId,
  });

  const request: CreateMessageRequest = {
    method: 'sampling/createMessage',
    params: {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: prompt },
        },
      ],
      maxTokens: 2000,
    },
  };

  // context.server.createMessage tends to fail with HTTP transport; use extra.sendRequest instead
  const result = await extra.sendRequest(request, CreateMessageResultSchema, {
    timeout: 60000,
  });

  const text = extractTextContent(result.content);
  return text ? parseLocationResponse(text) : null;
}

// =============================================================================
// Code Location via Claude Agent SDK
// =============================================================================

/**
 * Locate code using Claude Agent SDK with read-only tools.
 */
async function locateViaAgentSDK(
  apiKey: string,
  method: string,
  path: string,
  framework: Framework,
  projectRoot: string,
  operationId?: string
): Promise<CodeLocation | null> {
  const prompt = buildLocatorPrompt({
    method,
    path,
    framework,
    projectRoot,
    operationId,
  });

  return withApiKey(apiKey, async () => {
    const responseText = await collectAgentText(
      query({
        prompt,
        options: {
          cwd: projectRoot,
          allowedTools: ['Read', 'Glob', 'Grep'],
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          maxTurns: 10,
        },
      })
    );

    return parseLocationResponse(responseText);
  });
}

// =============================================================================
// Main Correlation Logic
// =============================================================================

/**
 * Check if client supports sampling capability.
 */
function clientSupportsSampling(server: Server): boolean {
  const capabilities = server.getClientCapabilities();
  return !!capabilities?.sampling;
}

interface CorrelationContext {
  context: ExtendedToolContext;
  extra: ToolExtra;
  apiKey: string | undefined;
  framework: Framework;
  projectRoot: string;
  logger: Logger;
}

/**
 * Correlate a single finding with its code location.
 */
async function correlateOne(
  finding: BaseFinding,
  ctx: CorrelationContext
): Promise<ExtendedFinding> {
  const specContext = extractSpecContext(finding);
  let codeLocation: CodeLocation | null = null;

  // Try sampling first if client supports it
  if (clientSupportsSampling(ctx.context.server)) {
    try {
      codeLocation = await locateViaSampling(
        ctx.extra,
        specContext.method,
        specContext.path,
        ctx.framework,
        ctx.projectRoot
      );
    } catch (error) {
      await ctx.logger.warning('Sampling failed, will try SDK fallback', {
        error: error instanceof Error ? error.message : String(error),
        operation: `${specContext.method} ${specContext.path}`,
      });
    }
  }

  // Fallback to Agent SDK if sampling failed or unavailable
  if (!codeLocation && ctx.apiKey) {
    try {
      codeLocation = await locateViaAgentSDK(
        ctx.apiKey,
        specContext.method,
        specContext.path,
        ctx.framework,
        ctx.projectRoot
      );
    } catch (error) {
      await ctx.logger.error('Agent SDK fallback failed', {
        error: error instanceof Error ? error.message : String(error),
        operation: `${specContext.method} ${specContext.path}`,
      });
    }
  }

  return {
    finding,
    specContext,
    codeLocations: codeLocation ? [codeLocation] : [],
  };
}

// =============================================================================
// Tool Factory
// =============================================================================

const BATCH_SIZE = 3; // Conservative to avoid rate limits

/**
 * Create the aip-correlate tool with the given context.
 */
export function createCorrelateTool(context: ExtendedToolContext) {
  const logger = createLogger(context.server, 'aip-correlate');

  return {
    name: 'aip-correlate',
    description:
      'Correlate AIP review findings with code locations. Uses MCP sampling when available, falls back to Claude Agent SDK. Returns ExtendedFinding[] with file:line references for each API endpoint.',
    inputSchema: CorrelateInputSchema,
    outputSchema: CorrelateOutputSchema,
    // TODO: use request context to authorize access to reviewId findings
    async execute(input: CorrelateInput, extra: ToolExtra) {
      const {
        reviewId,
        specPath,
        projectRoot = process.cwd(),
        framework = 'unknown',
        correlationLevel = 'moderate',
      } = input;

      // Resolve API key for SDK fallback
      const apiKey = resolveApiKey({
        input: input.apiKey,
        headers: context.httpHeaders,
      });

      // Check if we have any way to correlate
      const hasSampling = clientSupportsSampling(context.server);
      const canCorrelate = hasSampling || !!apiKey;

      await logger.info('Starting correlation', {
        hasSampling,
        hasApiKey: !!apiKey,
        correlationLevel,
        framework,
      });

      if (!canCorrelate) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error:
                  'No correlation method available. Either use a client that supports MCP sampling or provide an API key.',
                hint: 'Set apiKey parameter, X-Anthropic-Key header, ANTHROPIC_API_KEY, or CLAUDE_CODE_OAUTH_TOKEN environment variable.',
              }),
            },
          ],
          isError: true,
        };
      }

      // Load findings from cache using reviewId
      const cached = await getFindings(reviewId);
      if (!cached) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Review not found: ${reviewId}`,
                hint: 'Run aip-review first to generate findings.',
              }),
            },
          ],
          isError: true,
        };
      }
      const findings: BaseFinding[] = (cached.findings as BaseFinding[]) ?? [];

      // Filter findings based on correlation level
      const filteredFindings = filterFindings(findings, correlationLevel);

      await logger.info('Filtered findings', {
        total: findings.length,
        filtered: filteredFindings.length,
        level: correlationLevel,
      });

      // Dedupe by operation
      const operationMap = dedupeByOperation(filteredFindings);

      // Build correlation context
      const correlationCtx: CorrelationContext = {
        context,
        extra,
        apiKey,
        framework,
        projectRoot,
        logger,
      };

      // Process operations in batches
      let correlatedCount = 0;
      const extendedFindings = await processMapBatched(
        operationMap.entries(),
        BATCH_SIZE,
        async (_key, findingsForOp) => {
          // Use first finding as representative
          const representative = findingsForOp[0];
          const extended = await correlateOne(representative, correlationCtx);

          // Return extended finding for each finding in this operation
          const results: ExtendedFinding[] = findingsForOp.map((f) => ({
            ...extended,
            finding: f,
          }));

          if (extended.codeLocations.length > 0) {
            correlatedCount += findingsForOp.length;
          }

          return results;
        },
        async (batchIndex, batchSize, total) => {
          await logger.debug(`Processing batch ${batchIndex + 1}`, {
            batchSize,
            totalOperations: total,
          });
        }
      );

      // Build enriched findings structure by adding code locations to existing findings
      const enrichedFindings = {
        ...cached,
        findings: (cached.findings as BaseFinding[]).map((f) => {
          const extended = extendedFindings.find(
            (ef) => ef.finding.path === f.path && ef.finding.ruleId === f.ruleId
          );
          return extended
            ? {
                ...f,
                codeLocations: extended.codeLocations,
              }
            : f;
        }),
        correlationMetadata: {
          correlatedAt: new Date().toISOString(),
          framework,
          summary: {
            totalFindings: filteredFindings.length,
            correlated: correlatedCount,
            notFound: filteredFindings.length - correlatedCount,
          },
        },
      };

      // Store enriched findings (UPDATE at same reviewId)
      let stored: StoreResult;
      try {
        stored = await storeFindings(reviewId, enrichedFindings);
      } catch (e) {
        await logger.error('Failed to store correlation', { error: String(e) });
        // Fallback: no storage available
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

      // Build compact output (for tool response)
      const compactOutput: CorrelateOutput = {
        reviewId,
        specPath: specPath ?? 'unknown',
        framework,
        summary: {
          totalFindings: filteredFindings.length,
          correlated: correlatedCount,
          notFound: filteredFindings.length - correlatedCount,
        },
        expiresAt: new Date(stored.expiresAt).toISOString(),
      };

      await logger.info('Correlation complete', { ...compactOutput.summary });

      // Build response with resource link (similar to aip-review pattern)
      const textContent = {
        type: 'text' as const,
        text: JSON.stringify(compactOutput, null, 2),
      };

      const resourceUri = `aip://findings/${reviewId}`;

      return {
        content: [
          textContent,
          {
            type: 'resource_link' as const,
            uri: resourceUri,
            name: `findings-${reviewId}.json`,
            description: 'AIP review findings with code locations',
            mimeType: 'application/json',
          },
        ],
        structuredContent: compactOutput,
      };
    },
  };
}
