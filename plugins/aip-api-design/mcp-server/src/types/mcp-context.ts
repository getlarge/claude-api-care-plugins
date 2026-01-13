/**
 * MCP Handler Context Types
 *
 * Local type definitions for @platformatic/mcp handler context.
 * These match the internal types from the library since they're not exported.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CallToolResult, ReadResourceResult } from '@platformatic/mcp';

// Re-export for external consumers
export type { CallToolResult, ReadResourceResult };

/**
 * Authorization context extracted from OAuth2 tokens.
 */
export interface AuthorizationContext {
  userId?: string;
  clientId?: string;
  scopes?: string[];
  audience?: string[];
  tokenType?: string;
  tokenHash?: string;
  expiresAt?: Date;
  issuedAt?: Date;
  refreshToken?: string;
  authorizationServer?: string;
  sessionBoundToken?: string;
}

/**
 * Context passed to MCP tool/resource/prompt handlers.
 * Mirrors HandlerContext from @platformatic/mcp/types.
 */
export interface HandlerContext {
  sessionId?: string;
  request: FastifyRequest;
  reply: FastifyReply;
  authContext?: AuthorizationContext;
}

/**
 * MCP Resource definition.
 */
export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: {
    audience?: string[];
    priority?: number;
  };
}

/**
 * MCP Resource Template definition.
 */
export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * Custom handler for resources/list - allows dynamic resource enumeration.
 * Return null/undefined to fall back to default behavior.
 */
export type ResourcesListHandler = (
  params: { cursor?: string },
  context: HandlerContext
) => Promise<{ resources: Resource[]; nextCursor?: string } | null | undefined>;

/**
 * Custom handler for resources/read - allows dynamic resource resolution.
 * Return null/undefined to fall back to pattern matching + registered handlers.
 */
export type ResourcesReadHandler = (
  uri: string,
  context: HandlerContext
) => Promise<ReadResourceResult | null | undefined>;

/**
 * Custom handler for resources/templates/list.
 * Return null/undefined to fall back to default behavior.
 */
export type ResourcesTemplatesListHandler = (
  params: { cursor?: string },
  context: HandlerContext
) => Promise<
  | { resourceTemplates: ResourceTemplate[]; nextCursor?: string }
  | null
  | undefined
>;

/**
 * Fastify instance augmentation for custom resource handlers.
 */
declare module 'fastify' {
  interface FastifyInstance {
    // Custom resource handler setters
    mcpSetResourcesListHandler(handler: ResourcesListHandler): void;
    mcpSetResourcesReadHandler(handler: ResourcesReadHandler): void;
    mcpSetResourcesTemplatesListHandler(
      handler: ResourcesTemplatesListHandler
    ): void;
    // Subscription store accessor for notification logic
    mcpGetResourceSubscriptions(): Map<string, Set<string>>;
  }
}
