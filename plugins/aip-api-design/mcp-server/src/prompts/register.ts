/**
 * Prompt Registration
 *
 * Registers MCP prompt handlers with the server.
 *
 * ## Design Decisions
 *
 * 1. **Zod for Validation**: We use Zod schemas for runtime validation of prompt
 *    arguments. This provides type safety and detailed error messages.
 *
 * 2. **No Pagination Yet**: Currently returns all prompts in a single page.
 *    As we add more prompts, we'll implement cursor-based pagination.
 *
 * 3. **Error Handling**: Invalid prompt names and arguments return JSON-RPC
 *    error code -32602 (Invalid params) per MCP specification.
 *
 * 4. **Prompt Registry Pattern**: Centralized PROMPTS array makes it easy to
 *    add new prompts - just implement the handler and add to the array.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  type ListPromptsRequest,
  type GetPromptRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToPromptArguments, type PromptDefinition } from './types.js';
import { codeLocatorPrompt } from './handlers/index.js';

/**
 * Registry of all available prompts.
 */
const PROMPTS: PromptDefinition[] = [
  codeLocatorPrompt,
  // Future prompts added here
];

/**
 * Register prompt handlers with the MCP server.
 */
export function registerPrompts(server: Server) {
  server.setRequestHandler(
    ListPromptsRequestSchema,
    async (_request: ListPromptsRequest) => {
      // Note: Pagination not implemented yet (cursor ignored)
      // All prompts returned in single page
      return {
        prompts: PROMPTS.map((p) => ({
          name: p.name,
          title: p.title,
          description: p.description,
          arguments: zodToPromptArguments(p.argsSchema),
        })),
      };
    }
  );

  server.setRequestHandler(
    GetPromptRequestSchema,
    async (request: GetPromptRequest) => {
      const { name, arguments: args = {} } = request.params;

      const promptDef = PROMPTS.find((p) => p.name === name);
      if (!promptDef) {
        throw new McpError(-32602, `Unknown prompt: ${name}`);
      }

      try {
        const validated = promptDef.argsSchema.parse(args);
        return await promptDef.handler.execute(validated);
      } catch (error) {
        if (error instanceof Error && 'issues' in error) {
          // Zod validation error
          throw new McpError(-32602, `Invalid arguments: ${error.message}`);
        }
        throw error;
      }
    }
  );
}
