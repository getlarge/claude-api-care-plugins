/**
 * Prompt Registration
 *
 * Registers MCP prompt handlers with @platformatic/mcp.
 * Uses mcpAddPrompt for Fastify-native prompt registration with TypeBox schemas.
 *
 * ## Design Decisions
 *
 * 1. **TypeBox for Validation**: We use TypeBox schemas for runtime validation of prompt
 *    arguments. This provides type safety and integrates with @platformatic/mcp.
 *
 * 2. **No Pagination Yet**: Currently returns all prompts in a single page.
 *    As we add more prompts, we'll implement cursor-based pagination.
 *
 * 3. **Prompt Registry Pattern**: PROMPTS array makes it easy to add new prompts -
 *    just implement the handler and add to the array.
 */

import type { FastifyInstance } from 'fastify';
import type { GetPromptResult } from '@platformatic/mcp';
import type { PromptDefinition } from './types.js';
import {
  codeLocatorPrompt,
  aipLookupPrompt,
  CodeLocatorArgsSchema,
  AipLookupArgsSchema,
} from './handlers/index.js';

/**
 * Registry of all available prompts.
 */
const PROMPTS: PromptDefinition[] = [codeLocatorPrompt, aipLookupPrompt];

/**
 * Register all AIP prompts with the Fastify instance.
 */
export function registerAipPrompts(fastify: FastifyInstance) {
  // Code Locator Prompt
  fastify.mcpAddPrompt(
    {
      name: codeLocatorPrompt.name,
      description: codeLocatorPrompt.description,
      argumentSchema: CodeLocatorArgsSchema,
    },
    async (
      _name: string,
      args: {
        method: string;
        path: string;
        framework?: 'nestjs' | 'fastify' | 'express' | 'unknown';
        projectRoot: string;
        operationId?: string;
      }
    ): Promise<GetPromptResult> => {
      return codeLocatorPrompt.handler.execute(args);
    }
  );

  // AIP Lookup Prompt
  fastify.mcpAddPrompt(
    {
      name: aipLookupPrompt.name,
      description: aipLookupPrompt.description,
      argumentSchema: AipLookupArgsSchema,
    },
    async (
      _name: string,
      args: { aip: string; context?: string; finding?: string }
    ): Promise<GetPromptResult> => {
      return aipLookupPrompt.handler.execute(args);
    }
  );

  fastify.log.info(
    { prompts: PROMPTS.map((p) => p.name) },
    'AIP prompts registered'
  );
}

// Export for testing
export { PROMPTS };
