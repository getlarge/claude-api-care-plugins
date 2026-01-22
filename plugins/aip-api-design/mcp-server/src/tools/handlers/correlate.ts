/**
 * AIP Correlate Handler
 *
 * Correlates AIP review findings with code locations using LLM reasoning.
 * Adapted for @platformatic/mcp HandlerContext.
 *
 * Uses Claude Agent SDK for code location discovery.
 * MCP sampling support could be added in the future if the client supports it.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

import type {
  HandlerContext,
  CallToolResult,
} from '../../types/mcp-context.js';

import { getFindings, storeFindings } from '../../services/findings-storage.js';
import { resolveApiKey, withApiKey } from '../../services/api-key.js';
import {
  parseJsonResponse,
  collectAgentText,
} from '../../services/llm-response.js';
import {
  buildLocatorPrompt,
  type Framework,
} from '../../prompts/code-locator.js';
import { processMapBatched } from '../../utils/batch.js';
import type { StoreResult } from '../../services/temp-storage.js';
import type { WorkerPool } from '../worker-pool.js';
import type {
  CorrelateInput,
  CorrelateOutput,
  BaseFinding,
  CodeLocation,
  CodeLocationType,
  SpecContext,
  ExtendedFinding,
} from '../../schemas/index.js';

// =============================================================================
// Types
// =============================================================================

interface CorrelateHandlerDeps {
  workerPool: WorkerPool;
  context: HandlerContext;
}

type CorrelationLevel = 'minimal' | 'moderate' | 'thorough';

interface CorrelationContext {
  apiKey: string | undefined;
  framework: Framework;
  projectRoot: string;
  request: HandlerContext['request'];
}

// =============================================================================
// Finding Processing
// =============================================================================

const CODE_LOCATION_TYPES: CodeLocationType[] = [
  'controller',
  'handler',
  'route',
  'schema',
  'dto',
  'service',
  'decorator',
];

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
  if (type && CODE_LOCATION_TYPES.includes(type as CodeLocationType)) {
    return type as CodeLocationType;
  }
  return 'controller';
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

const BATCH_SIZE = 3; // Conservative to avoid rate limits

/**
 * Correlate a single finding with its code location.
 */
async function correlateOne(
  finding: BaseFinding,
  ctx: CorrelationContext
): Promise<ExtendedFinding> {
  const specContext = extractSpecContext(finding);
  let codeLocation: CodeLocation | null = null;

  // Use Agent SDK if API key is available
  if (ctx.apiKey) {
    try {
      codeLocation = await locateViaAgentSDK(
        ctx.apiKey,
        specContext.method,
        specContext.path,
        ctx.framework,
        ctx.projectRoot
      );
    } catch (error) {
      ctx.request.log.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Agent SDK correlation failed'
      );
    }
  }

  return {
    finding,
    specContext,
    codeLocations: codeLocation ? [codeLocation] : [],
  };
}

// =============================================================================
// Handler
// =============================================================================

/**
 * Execute the aip-correlate tool.
 */
export async function executeCorrelate(
  params: CorrelateInput,
  deps: CorrelateHandlerDeps
): Promise<CallToolResult> {
  const { context } = deps;
  const {
    reviewId,
    specPath,
    projectRoot = process.cwd(),
    framework = 'unknown',
    correlationLevel = 'moderate',
  } = params;

  // Resolve API key for SDK fallback
  // Try: input param > X-Anthropic-Key header > env vars
  const apiKey = resolveApiKey({
    input: params.apiKey,
    headers: context.request.headers as Record<
      string,
      string | string[] | undefined
    >,
  });

  context.request.log.info(
    { hasApiKey: !!apiKey, correlationLevel, framework },
    'Starting correlation'
  );

  if (!apiKey) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error:
              'No API key available for correlation. Provide an apiKey parameter or set X-Anthropic-Key header, ANTHROPIC_API_KEY, or CLAUDE_CODE_OAUTH_TOKEN environment variable.',
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

  context.request.log.info(
    {
      total: findings.length,
      filtered: filteredFindings.length,
      level: correlationLevel,
    },
    'Filtered findings'
  );

  // Dedupe by operation
  const operationMap = dedupeByOperation(filteredFindings);

  // Build correlation context
  const correlationCtx: CorrelationContext = {
    apiKey,
    framework,
    projectRoot,
    request: context.request,
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
    async (batchIndex, _batchSize, total) => {
      context.request.log.debug(
        { batchIndex: batchIndex + 1, totalOperations: total },
        'Processing batch'
      );
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

  const resourceUri = `aip://findings?id=${reviewId}`;
  // Store enriched findings (UPDATE at same reviewId)
  let stored: StoreResult;
  try {
    stored = await storeFindings(reviewId, enrichedFindings);
    // TODO: Notify subscribers of updated findings resource
    // await fastify.mcpSendToSession(sessionId, {
    //   jsonrpc: '2.0',
    //   method: 'notifications/resources/updated',
    //   params: { uri: resourceUri },
    // });
  } catch (e) {
    context.request.log.error(
      { error: String(e) },
      'Failed to store correlation'
    );
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

  context.request.log.info(compactOutput.summary, 'Correlation complete');

  // Build response with resource link (similar to aip-review pattern)
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
        description: 'AIP review findings with code locations',
        mimeType: 'application/json',
      },
    ],
    structuredContent: compactOutput,
  };
}
