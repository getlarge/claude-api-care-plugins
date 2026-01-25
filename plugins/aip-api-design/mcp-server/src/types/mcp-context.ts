/**
 * MCP Handler Context Types
 *
 * Local type definitions for @getlarge/fastify-mcp handler context.
 * These match the internal types from the library since they're not exported.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CallToolResult, ReadResourceResult } from '@getlarge/fastify-mcp';

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
 * Mirrors HandlerContext from @getlarge/fastify-mcp/types.
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
 * Handler function type for resources/subscribe.
 * Uses SubscribeRequest['params'] from @getlarge/fastify-mcp/dist/schema.
 */
export type ResourceSubscribeHandler = (
  params: { uri: string },
  context: HandlerContext
) => Promise<Record<string, never>>;

/**
 * Handler function type for resources/unsubscribe.
 * Uses UnsubscribeRequest['params'] from @getlarge/fastify-mcp/dist/schema.
 */
export type ResourceUnsubscribeHandler = (
  params: { uri: string },
  context: HandlerContext
) => Promise<Record<string, never>>;

// Fastify instance augmentation is provided by @getlarge/fastify-mcp
