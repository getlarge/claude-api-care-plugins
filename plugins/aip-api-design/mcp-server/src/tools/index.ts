/**
 * MCP Tool Registration
 *
 * Registers all AIP OpenAPI reviewer tools with the MCP server.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createReviewTool,
  ReviewInputSchema,
  ReviewCompactOutputSchema,
} from './review.js';
import {
  listRulesTool,
  ListRulesInputSchema,
  ListRulesOutputSchema,
} from './list-rules.js';
import {
  getInfoTool,
  GetInfoInputSchema,
  GetInfoOutputSchema,
} from './get-info.js';
import {
  createApplyFixesTool,
  ApplyFixesInputSchema,
  ApplyFixesOutputSchema,
} from './apply-fixes.js';
import {
  createCorrelateTool,
  CorrelateInputSchema,
  CorrelateOutputSchema,
} from './correlate.js';
import type { ExtendedToolContext } from './types.js';

/**
 * Register all AIP tools with the MCP server.
 *
 * @param server - MCP server instance
 * @param context - Tool context containing shared dependencies (worker pool, server)
 */
export function registerTools(server: McpServer, context: ExtendedToolContext) {
  // Create tools with context (worker pool)
  const reviewTool = createReviewTool(context);
  const applyFixesTool = createApplyFixesTool(context);
  const correlateTool = createCorrelateTool(context);

  // aip-review: Analyze an OpenAPI spec against AIP guidelines
  server.registerTool(
    reviewTool.name,
    {
      description: reviewTool.description,
      inputSchema: ReviewInputSchema,
      outputSchema: ReviewCompactOutputSchema,
      annotations: {
        title: 'AIP OpenAPI Reviewer',
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => reviewTool.execute(args)
  );

  // aip-list-rules: List available AIP rules (no worker needed - fast operation)
  server.registerTool(
    listRulesTool.name,
    {
      description: listRulesTool.description,
      inputSchema: ListRulesInputSchema,
      outputSchema: ListRulesOutputSchema,
      annotations: {
        title: 'AIP OpenAPI Reviewer - List Rules',
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => listRulesTool.execute(args)
  );

  // aip-get-info: Get information about a specific AIP (no worker needed - fast operation)
  server.registerTool(
    getInfoTool.name,
    {
      description: getInfoTool.description,
      inputSchema: GetInfoInputSchema,
      outputSchema: GetInfoOutputSchema,
      annotations: {
        title: 'AIP OpenAPI Reviewer - Get AIP Info',
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => getInfoTool.execute(args)
  );

  // aip-apply-fixes: Apply suggested fixes to an OpenAPI spec
  server.registerTool(
    applyFixesTool.name,
    {
      description: applyFixesTool.description,
      inputSchema: ApplyFixesInputSchema,
      outputSchema: ApplyFixesOutputSchema,
      annotations: {
        title: 'AIP OpenAPI Reviewer - Apply Fixes',
        readOnlyHint: false,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async (args) => applyFixesTool.execute(args)
  );

  // aip-correlate: Correlate findings with code locations using LLM reasoning
  server.registerTool(
    correlateTool.name,
    {
      description: correlateTool.description,
      inputSchema: CorrelateInputSchema,
      outputSchema: CorrelateOutputSchema,
      annotations: {
        title: 'AIP OpenAPI Reviewer - Correlate Code',
        readOnlyHint: true,
        idempotentHint: false, // Uses LLM reasoning, may produce different results
      },
    },
    async (args, extra) => correlateTool.execute(args, extra)
  );
}

// Re-export for testing
export { listRulesTool, getInfoTool, createCorrelateTool };
