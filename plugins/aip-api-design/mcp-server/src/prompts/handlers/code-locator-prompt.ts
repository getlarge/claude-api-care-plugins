import { z } from 'zod';
import type { PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { buildLocatorPrompt } from '../code-locator.js';
import type { PromptDefinition } from '../types.js';

/**
 * Zod schema for code locator prompt arguments.
 */
export const CodeLocatorArgsSchema = z.object({
  method: z
    .string()
    .toUpperCase()
    .describe('HTTP method (GET, POST, PUT, PATCH, DELETE)'),
  path: z.string().describe('API path (e.g., /users/{id})'),
  framework: z
    .enum(['nestjs', 'fastify', 'express', 'unknown'])
    .default('unknown')
    .describe('Web framework used in the project'),
  projectRoot: z.string().describe('Root directory of the project to search'),
  operationId: z
    .string()
    .optional()
    .describe('OpenAPI operationId (if available)'),
});

export type CodeLocatorArgs = z.infer<typeof CodeLocatorArgsSchema>;

export const codeLocatorPrompt: PromptDefinition<typeof CodeLocatorArgsSchema> =
  {
    name: 'aip-code-locator',
    title: 'Find API Implementation',
    description:
      'Find the code file and line number where an API operation is implemented',
    argsSchema: CodeLocatorArgsSchema,
    handler: {
      async execute(args: CodeLocatorArgs) {
        const validated = CodeLocatorArgsSchema.parse(args);

        const promptText = buildLocatorPrompt({
          method: validated.method,
          path: validated.path,
          framework: validated.framework,
          projectRoot: validated.projectRoot,
          operationId: validated.operationId,
        });

        const messages: PromptMessage[] = [
          {
            role: 'user',
            content: {
              type: 'text',
              text: promptText,
            },
          },
        ];

        return {
          description: `Find code for ${validated.method} ${validated.path}`,
          messages,
        };
      },
    },
  };
