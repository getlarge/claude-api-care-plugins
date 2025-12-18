/**
 * Prompt Registry Types
 *
 * Type definitions for prompt metadata and handlers.
 */

import type {
  Prompt,
  GetPromptResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Prompt handler function that generates prompt messages.
 */
export interface PromptHandler<TArgs = Record<string, unknown>> {
  /**
   * Execute the prompt with validated arguments.
   */
  execute(args: TArgs): Promise<GetPromptResult>;
}

/**
 * Prompt definition with schema and handler.
 * Combines MCP's Prompt type with Zod validation.
 */
export interface PromptDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Unique prompt name */
  name: string;
  /** Human-readable title */
  title?: string;
  /** Human-readable description */
  description?: string;
  /** Zod schema for argument validation */
  argsSchema: TSchema;
  /** Handler function */
  handler: PromptHandler<z.infer<TSchema>>;
}

/**
 * Convert Zod schema to MCP PromptArgument array.
 */
export function zodToPromptArguments(
  schema: z.ZodTypeAny
): Prompt['arguments'] {
  // Extract shape from ZodObject
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Prompt arguments schema must be a ZodObject');
  }

  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  return Object.entries(shape).map(([name, fieldSchema]) => {
    const isOptional = fieldSchema instanceof z.ZodOptional;
    const innerSchema = isOptional ? fieldSchema.unwrap() : fieldSchema;

    // In Zod v4, description is directly accessible on the schema instance
    const description = (innerSchema as { description?: string }).description;

    return {
      name,
      description: description || `Argument: ${name}`,
      required: !isOptional,
    };
  });
}
