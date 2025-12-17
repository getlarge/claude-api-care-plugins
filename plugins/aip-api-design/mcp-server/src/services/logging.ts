/**
 * MCP Logging Service
 *
 * Provides structured logging via MCP logging notifications.
 * Falls back to console when MCP logging fails.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): Promise<void>;
  info(message: string, data?: Record<string, unknown>): Promise<void>;
  warning(message: string, data?: Record<string, unknown>): Promise<void>;
  error(message: string, data?: Record<string, unknown>): Promise<void>;
}

/**
 * Log a message via MCP logging notification.
 *
 * @param server - MCP server instance
 * @param level - Log level
 * @param logger - Logger name (e.g., 'aip-correlate')
 * @param message - Log message
 * @param data - Optional structured data
 */
export async function log(
  server: Server,
  level: LogLevel,
  logger: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await server.sendLoggingMessage({
      level,
      logger,
      data: data ? { message, ...data } : message,
    });
  } catch {
    // Logging failure is non-fatal, fall back to console
    const consoleMethod = level === 'warning' ? 'warn' : level;
    console[consoleMethod](`[${logger}] ${message}`, data ?? '');
  }
}

/**
 * Create a namespaced logger instance.
 *
 * @param server - MCP server instance
 * @param name - Logger name
 * @returns Logger interface with level methods
 */
export function createLogger(server: Server, name: string): Logger {
  return {
    debug: (message, data) => log(server, 'debug', name, message, data),
    info: (message, data) => log(server, 'info', name, message, data),
    warning: (message, data) => log(server, 'warning', name, message, data),
    error: (message, data) => log(server, 'error', name, message, data),
  };
}
