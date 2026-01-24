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
        'Analyze/lint an OpenAPI spec against Google AIP guidelines. Checks naming, pagination, errors, idempotency, filtering. Returns reviewId for caching - pass to aip-apply-fixes or access via aip://findings resource.',
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
        'List available AIP linting rules. Filter by AIP number (122, 158, 193...) or category (naming, pagination, errors, standard-methods, idempotency, filtering).',
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
        'Get information about a specific AIP (API Improvement Proposal) by number. Returns summary, link to google.aip.dev, and key requirements.',
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
        'Auto-fix AIP violations in an OpenAPI spec. Requires reviewId from aip-review. Supports specPath (local file, can writeBack) or specUrl (HTTP). Returns modified spec via signed URL or writes to disk.',
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
        'Find source code locations for AIP violations. Supports NestJS, Fastify, Express frameworks. Returns file:line references for each finding. Requires reviewId from aip-review.',
      inputSchema: CorrelateInputSchema,
    },
    async (params: CorrelateInput, context: HandlerContext) => {
      return executeCorrelate(params, { ...toolDeps, context });
    }
  );
}
