/**
 * HTTP MCP Test Client
 *
 * Provides utilities for testing MCP servers via HTTP transport.
 * Uses Server-Sent Events (SSE) for bidirectional communication.
 */

import type { JsonRpcRequest, JsonRpcResponse } from './mcp-client.js';

export interface HttpMcpClientOptions {
  /**
   * Base URL of the MCP server.
   * Default: 'http://localhost:4000'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * Default: 30000
   */
  timeout?: number;

  /**
   * Optional bearer token for authentication.
   */
  accessToken?: string;
}

/**
 * HTTP-based MCP Test Client - uses HTTP transport for testing.
 * Supports both direct HTTP calls and SSE for streaming.
 */
export class HttpMcpTestClient {
  private baseUrl: string;
  private timeout: number;
  private accessToken?: string;
  private sessionId?: string;
  private msgId = 0;

  constructor(options: HttpMcpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'http://localhost:4000';
    this.timeout = options.timeout ?? 30000;
    this.accessToken = options.accessToken;
  }

  /**
   * Initialize a new MCP session.
   */
  async start(): Promise<void> {
    const response = await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'http-e2e-test', version: '1.0.0' },
    });

    if (response.error) {
      throw new Error(`Failed to initialize: ${response.error.message}`);
    }

    // The MCP protocol may return session info
    // For now, we just confirm it works
  }

  /**
   * Close the MCP session.
   */
  async stop(): Promise<void> {
    // HTTP transport is stateless per request, no cleanup needed
    this.sessionId = undefined;
  }

  /**
   * Send a JSON-RPC request to the MCP server.
   */
  async send(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<JsonRpcResponse> {
    const id = ++this.msgId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Capture session ID from response headers if present
      const newSessionId = response.headers.get('Mcp-Session-Id');
      if (newSessionId) {
        this.sessionId = newSessionId;
      }

      if (!response.ok) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      const result = (await response.json()) as JsonRpcResponse;
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: `Request timed out after ${this.timeout}ms`,
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Call an MCP tool.
   */
  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    return this.send('tools/call', { name, arguments: args });
  }

  /**
   * List available tools.
   */
  async listTools(): Promise<JsonRpcResponse> {
    return this.send('tools/list', {});
  }

  /**
   * Read a resource by URI.
   */
  async readResource(uri: string): Promise<JsonRpcResponse> {
    return this.send('resources/read', { uri });
  }

  /**
   * List available resources.
   */
  async listResources(): Promise<JsonRpcResponse> {
    return this.send('resources/list', {});
  }

  /**
   * Get a prompt.
   */
  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<JsonRpcResponse> {
    return this.send('prompts/get', { name, arguments: args });
  }

  /**
   * List available prompts.
   */
  async listPrompts(): Promise<JsonRpcResponse> {
    return this.send('prompts/list', {});
  }

  /**
   * Parse the text content from a tool response.
   */
  parseTextContent(response: JsonRpcResponse): Record<string, unknown> | null {
    const textContent = response.result?.content?.find(
      (c) => c.type === 'text'
    );
    if (!textContent?.text) return null;
    try {
      return JSON.parse(textContent.text);
    } catch {
      return null;
    }
  }

  /**
   * Check server health.
   */
  async health(): Promise<{
    status: string;
    version: string;
    tempStorage?: { count: number; type: string };
    workerPool?: { total: number; available: number; queued: number };
  }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Set access token for authenticated requests.
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Clear access token.
   */
  clearAccessToken(): void {
    this.accessToken = undefined;
  }

  /**
   * Get the current session ID.
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }
}

/**
 * Wait for the server to be healthy.
 * Useful for tests that need to wait for Docker containers to start.
 */
export async function waitForServer(
  baseUrl: string = 'http://localhost:4000',
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout ?? 30000;
  const interval = options.interval ?? 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `Server at ${baseUrl} did not become healthy within ${timeout}ms`
  );
}
