/**
 * Logging Service
 *
 * Provides structured logging using Fastify's native logger.
 * Replaces the MCP SDK logging with standard Fastify logging.
 */

import type { FastifyBaseLogger } from 'fastify';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Create a namespaced logger instance from a Fastify logger.
 *
 * @param baseLogger - Fastify logger instance (e.g., fastify.log or request.log)
 * @param name - Logger name (added to log context)
 * @returns Logger interface with level methods
 */
export function createLogger(
  baseLogger: FastifyBaseLogger,
  name: string
): Logger {
  const child = baseLogger.child({ logger: name });

  return {
    debug: (message, data) =>
      child.debug(data ? { ...data, msg: message } : message),
    info: (message, data) =>
      child.info(data ? { ...data, msg: message } : message),
    warn: (message, data) =>
      child.warn(data ? { ...data, msg: message } : message),
    error: (message, data) =>
      child.error(data ? { ...data, msg: message } : message),
  };
}

/**
 * Create a simple console logger for use outside Fastify context.
 *
 * @param name - Logger name
 * @returns Logger interface with level methods
 */
export function createConsoleLogger(name: string): Logger {
  const prefix = `[${name}]`;

  return {
    debug: (message, data) => console.debug(`${prefix} ${message}`, data ?? ''),
    info: (message, data) => console.info(`${prefix} ${message}`, data ?? ''),
    warn: (message, data) => console.warn(`${prefix} ${message}`, data ?? ''),
    error: (message, data) => console.error(`${prefix} ${message}`, data ?? ''),
  };
}
