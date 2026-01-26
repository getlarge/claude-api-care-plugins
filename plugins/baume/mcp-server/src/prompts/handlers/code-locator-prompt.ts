/**
 * Code Locator Prompt
 *
 * Prompt handler for finding API implementation code locations.
 * Migrated from Zod to TypeBox for @getlarge/fastify-mcp compatibility.
 */

import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { GetPromptResult } from '@getlarge/fastify-mcp';
import { buildLocatorPrompt, type Framework } from '../code-locator.js';
import type { PromptDefinition } from '../types.js';

/**
 * TypeBox schema for code locator prompt arguments.
 */
export const CodeLocatorArgsSchema = Type.Object({
  method: Type.String({
    description: 'HTTP method (GET, POST, PUT, PATCH, DELETE)',
  }),
  path: Type.String({
    description: 'API path (e.g., /users/{id})',
  }),
  framework: Type.Optional(
    Type.Union(
      [
        Type.Literal('nestjs'),
        Type.Literal('fastify'),
        Type.Literal('express'),
        Type.Literal('unknown'),
      ],
      { default: 'unknown', description: 'Web framework used in the project' }
    )
  ),
  projectRoot: Type.String({
    description: 'Root directory of the project to search',
  }),
  operationId: Type.Optional(
    Type.String({
      description: 'OpenAPI operationId (if available)',
    })
  ),
});

export type CodeLocatorArgs = Static<typeof CodeLocatorArgsSchema>;

export const codeLocatorPrompt: PromptDefinition<typeof CodeLocatorArgsSchema> =
  {
    name: 'baume-code-locator',
    title: 'Find API Implementation',
    description:
      'Find the code file and line number where an API operation is implemented',
    argsSchema: CodeLocatorArgsSchema,
    handler: {
      async execute(args: CodeLocatorArgs): Promise<GetPromptResult> {
        // @getlarge/fastify-mcp validates the schema before calling this handler
        // Apply defaults for optional fields
        const validated = Value.Default(
          CodeLocatorArgsSchema,
          args
        ) as CodeLocatorArgs;
        const method = validated.method.toUpperCase();
        const framework = (validated.framework ?? 'unknown') as Framework;

        const promptText = buildLocatorPrompt({
          method,
          path: validated.path,
          framework,
          projectRoot: validated.projectRoot,
          operationId: validated.operationId,
        });

        return {
          description: `Find code for ${method} ${validated.path}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: promptText,
              },
            },
          ],
        };
      },
    },
  };
