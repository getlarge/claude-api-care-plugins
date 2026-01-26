/**
 * Shared MCP Test Client
 *
 * Provides utilities for testing MCP servers via STDIO transport.
 * Used by e2e tests to spawn a server process and communicate via JSON-RPC.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', '..', 'dist');

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    content?: Array<{
      type: string;
      text?: string;
      uri?: string;
      name?: string;
      description?: string;
      mimeType?: string;
    }>;
    contents?: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
    messages?: Array<{
      role: string;
      content: { type: string; text?: string };
    }>;
    prompts?: Array<{
      name: string;
      title?: string;
      description?: string;
      arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
      }>;
    }>;
    resources?: Array<{
      uri: string;
      name: string;
      description?: string;
      mimeType?: string;
      annotations?: {
        audience?: string[];
        priority?: number;
      };
    }>;
    resourceTemplates?: Array<{
      uriTemplate: string;
      name: string;
      description?: string;
      mimeType?: string;
    }>;
    nextCursor?: string;
    description?: string;
  };
  error?: { code: number; message: string; data?: unknown };
}

/**
 * MCP Test Client - manages a server process and provides helpers for testing
 */
export class McpTestClient {
  private server: ChildProcess | null = null;
  private readline: Interface | null = null;
  private msgId = 0;
  private pending = new Map<
    number,
    { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }
  >();

  async start(): Promise<void> {
    this.server = spawn('node', [join(DIST_DIR, 'stdio.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.readline = createInterface({ input: this.server.stdout! });

    this.readline.on('line', (line) => {
      try {
        const msg = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pending.get(msg.id);
        if (pending) {
          this.pending.delete(msg.id);
          pending.resolve(msg);
        }
      } catch {
        // Ignore non-JSON lines (e.g., worker pool logs)
      }
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Initialize MCP session
    await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-test', version: '1.0.0' },
    });
  }

  async stop(): Promise<void> {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
    if (this.server) {
      this.server.kill();
      this.server = null;
    }
    this.pending.clear();
  }

  async send(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<JsonRpcResponse> {
    if (!this.server?.stdin) {
      throw new Error('Server not started');
    }

    const id = ++this.msgId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request ${id} timed out`));
      }, 30000);

      this.pending.set(id, {
        resolve: (r) => {
          clearTimeout(timeout);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });

      this.server!.stdin!.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    return this.send('tools/call', { name, arguments: args });
  }

  /**
   * Parse the text content from a tool response
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
}
