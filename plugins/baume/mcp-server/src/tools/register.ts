/**
 * MCP Tool Registration
 *
 * Registers all Baume API hygiene tools with @platformatic/mcp.
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
  WhoamiInputSchema,
  type ReviewInput,
  type ListRulesInput,
  type GetInfoInput,
  type ApplyFixesInput,
  type CorrelateInput,
  type WhoamiInput,
} from '../schemas/index.js';
import { executeReview } from './handlers/review.js';
import { executeListRules } from './handlers/list-rules.js';
import { executeGetInfo } from './handlers/get-info.js';
import { executeApplyFixes } from './handlers/apply-fixes.js';
import { executeCorrelate } from './handlers/correlate.js';
import { executeWhoami } from './handlers/whoami.js';
import type { WorkerPool } from './worker-pool.js';

/**
 * Context passed to tool handlers.
 */
export interface ToolDependencies {
  workerPool: WorkerPool;
  fastify: FastifyInstance;
}

/**
 * Register all Baume tools with the Fastify instance.
 */
export function registerBaumeTools(
  fastify: FastifyInstance,
  deps: Omit<ToolDependencies, 'fastify'>
) {
  const { workerPool } = deps;
  const toolDeps: ToolDependencies = { workerPool, fastify };

  // baume-review: Analyze an OpenAPI spec against API best practices
  fastify.mcpAddTool(
    {
      name: 'baume-review',
      description:
        'Analyze/lint an OpenAPI spec against Google AIP guidelines. ' +
        'Checks naming, pagination, errors, idempotency, filtering. ' +
        'Returns reviewId for caching - pass to baume-apply-fixes or access via baume://findings resource.',
      inputSchema: ReviewInputSchema,
    },
    async (params: ReviewInput, context: HandlerContext) => {
      return executeReview(params, { ...toolDeps, context });
    }
  );

  // baume-list-rules: List available rules
  fastify.mcpAddTool(
    {
      name: 'baume-list-rules',
      description:
        'List available AIP linting rules. Filter by AIP number (122, 158, 193...) or category (naming, pagination, errors, standard-methods, idempotency, filtering).',
      inputSchema: ListRulesInputSchema,
    },
    async (params: ListRulesInput, _context: HandlerContext) => {
      return executeListRules(params);
    }
  );

  // baume-get-info: Get information about a specific AIP
  fastify.mcpAddTool(
    {
      name: 'baume-get-info',
      description:
        'Get information about a specific AIP (API Improvement Proposal) by number. Returns summary, link to google.aip.dev, and key requirements.',
      inputSchema: GetInfoInputSchema,
    },
    async (params: GetInfoInput, _context: HandlerContext) => {
      return executeGetInfo(params);
    }
  );

  // baume-apply-fixes: Apply suggested fixes to an OpenAPI spec
  fastify.mcpAddTool(
    {
      name: 'baume-apply-fixes',
      description:
        'Auto-fix AIP violations in an OpenAPI spec. Requires reviewId from baume-review. ' +
        'Supports spec.path (local file, can writeBack) or spec.url (HTTP). ' +
        'Returns modified spec via signed URL or writes to disk.',
      inputSchema: ApplyFixesInputSchema,
    },
    async (params: ApplyFixesInput, context: HandlerContext) => {
      return executeApplyFixes(params, { ...toolDeps, context });
    }
  );

  // baume-correlate: Correlate findings with code locations
  fastify.mcpAddTool(
    {
      name: 'baume-correlate',
      description:
        'Find source code locations for AIP violations. Supports NestJS, Fastify, Express frameworks. Returns file:line references for each finding. Requires reviewId from baume-review.',
      inputSchema: CorrelateInputSchema,
    },
    async (params: CorrelateInput, context: HandlerContext) => {
      return executeCorrelate(params, { ...toolDeps, context });
    }
  );

  // baume-whoami: Return authenticated user info (for E2E testing)
  fastify.mcpAddTool(
    {
      name: 'baume-whoami',
      description:
        'Return information about the authenticated user from the OAuth2 token. Useful for verifying authentication is working correctly.',
      inputSchema: WhoamiInputSchema,
    },
    async (_params: WhoamiInput, context: HandlerContext) => {
      return executeWhoami(context);
    }
  );
}
