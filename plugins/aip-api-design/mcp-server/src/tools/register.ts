/**
 * MCP Tool Registration
 *
 * Registers all AIP OpenAPI reviewer tools with @platformatic/mcp.
 * Uses mcpAddTool for Fastify-native tool registration with TypeBox schemas.
 */

import type { FastifyInstance } from 'fastify';

import type { HandlerContext } from '../types/mcp-context.js';

import {
  ReviewInputSchema,
  ListRulesInputSchema,
  GetInfoInputSchema,
  ApplyFixesInputSchema,
  CorrelateInputSchema,
  type ReviewInput,
  type ListRulesInput,
  type GetInfoInput,
  type ApplyFixesInput,
  type CorrelateInput,
} from '../schemas/index.js';
import { executeReview } from './handlers/review.js';
import { executeListRules } from './handlers/list-rules.js';
import { executeGetInfo } from './handlers/get-info.js';
import { executeApplyFixes } from './handlers/apply-fixes.js';
import { executeCorrelate } from './handlers/correlate.js';
import type { WorkerPool } from './worker-pool.js';

/**
 * Context passed to tool handlers.
 */
export interface ToolDependencies {
  workerPool: WorkerPool;
  fastify: FastifyInstance;
}

/**
 * Register all AIP tools with the Fastify instance.
 */
export function registerAipTools(
  fastify: FastifyInstance,
  deps: Omit<ToolDependencies, 'fastify'>
) {
  const { workerPool } = deps;
  const toolDeps: ToolDependencies = { workerPool, fastify };

  // aip-review: Analyze an OpenAPI spec against AIP guidelines
  fastify.mcpAddTool(
    {
      name: 'aip-review',
      description:
        'Analyze an OpenAPI spec against Google AIP guidelines. Returns a compact summary with reviewId and a link to full findings. Use findingsPath/findingsUrl to access detailed findings, or pass reviewId to aip-apply-fixes.',
      inputSchema: ReviewInputSchema,
    },
    async (params: ReviewInput, context: HandlerContext) => {
      return executeReview(params, { ...toolDeps, context });
    }
  );

  // aip-list-rules: List available AIP rules
  fastify.mcpAddTool(
    {
      name: 'aip-list-rules',
      description:
        'List available AIP rules. Can filter by AIP number, category, or return all rules.',
      inputSchema: ListRulesInputSchema,
    },
    async (params: ListRulesInput, _context: HandlerContext) => {
      return executeListRules(params);
    }
  );

  // aip-get-info: Get information about a specific AIP
  fastify.mcpAddTool(
    {
      name: 'aip-get-info',
      description:
        'Get information about a specific AIP (API Improvement Proposal). Returns the AIP summary and link.',
      inputSchema: GetInfoInputSchema,
    },
    async (params: GetInfoInput, _context: HandlerContext) => {
      return executeGetInfo(params);
    }
  );

  // aip-apply-fixes: Apply suggested fixes to an OpenAPI spec
  fastify.mcpAddTool(
    {
      name: 'aip-apply-fixes',
      description:
        'Apply suggested fixes to an OpenAPI spec. Provide spec via: specPath (local file) or specUrl (HTTP URL). Use writeBack=true with specPath to save to disk. Returns a signed URL to download the modified spec (valid for 5 minutes).',
      inputSchema: ApplyFixesInputSchema,
    },
    async (params: ApplyFixesInput, context: HandlerContext) => {
      return executeApplyFixes(params, { ...toolDeps, context });
    }
  );

  // aip-correlate: Correlate findings with code locations
  fastify.mcpAddTool(
    {
      name: 'aip-correlate',
      description:
        'Correlate AIP review findings with code locations. Uses MCP sampling when available, falls back to Claude Agent SDK. Returns ExtendedFinding[] with file:line references for each API endpoint.',
      inputSchema: CorrelateInputSchema,
    },
    async (params: CorrelateInput, context: HandlerContext) => {
      return executeCorrelate(params, { ...toolDeps, context });
    }
  );
}
