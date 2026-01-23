/**
 * Prompt Registry Types
 *
 * Type definitions for prompt metadata and handlers.
 * Migrated from Zod to TypeBox for @platformatic/mcp compatibility.
 */

import type { TObject, Static } from '@sinclair/typebox';
import type { GetPromptResult } from '@platformatic/mcp';

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
 * Combines MCP's Prompt type with TypeBox validation.
 */
export interface PromptDefinition<TSchema extends TObject = TObject> {
  /** Unique prompt name */
  name: string;
  /** Human-readable title */
  title?: string;
  /** Human-readable description */
  description?: string;
  /** TypeBox schema for argument validation */
  argsSchema: TSchema;
  /** Handler function */
  handler: PromptHandler<Static<TSchema>>;
}

/**
 * MCP PromptArgument type (subset of MCP spec).
 */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Convert TypeBox schema to MCP PromptArgument array.
 */
export function typeboxToPromptArguments(schema: TObject): PromptArgument[] {
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];

  return Object.entries(properties).map(([name, fieldSchema]) => {
    const description =
      (fieldSchema as { description?: string }).description ??
      `Argument: ${name}`;
    const isRequired = required.includes(name);

    return {
      name,
      description,
      required: isRequired,
    };
  });
}
