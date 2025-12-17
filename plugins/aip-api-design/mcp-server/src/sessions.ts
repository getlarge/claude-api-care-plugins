import { FastifyReply } from 'fastify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

// ============================================================================
// Session Storage (adapted from fastify-mcp)
// ============================================================================

type SessionEvents = {
  connected: [string];
  terminated: [string];
  error: [unknown];
};

export class Sessions<T extends Transport>
  extends EventEmitter<SessionEvents>
  implements Iterable<T>
{
  private readonly sessions: Map<string, T>;

  constructor() {
    super({ captureRejections: true });
    this.sessions = new Map();
  }

  add = (id: string, transport: T) => {
    if (this.sessions.has(id)) {
      throw new Error('Session already exists');
    }
    this.sessions.set(id, transport);
    this.emit('connected', id);
  };

  remove = (id: string) => {
    this.sessions.delete(id);
    this.emit('terminated', id);
  };

  get = (id: string): T | undefined => {
    return this.sessions.get(id);
  };

  get count() {
    return this.sessions.size;
  }

  [Symbol.iterator]() {
    return this.sessions.values();
  }
}

// ============================================================================
// Transport Helpers (adapted from fastify-mcp)
// ============================================================================

export function createStatefulTransport(
  sessions: Sessions<StreamableHTTPServerTransport>
): StreamableHTTPServerTransport {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessions.add(id, transport);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.remove(transport.sessionId);
    }
  };

  return transport;
}

export function invalidSessionId(reply: FastifyReply): void {
  reply.status(400).send({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Bad Request: No valid session ID provided',
    },
    id: null,
  });
}
