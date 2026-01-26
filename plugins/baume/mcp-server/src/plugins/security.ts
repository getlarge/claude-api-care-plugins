/**
 * Security Plugin
 *
 * Provides origin validation (DNS rebinding protection) and input validation
 * per MCP security recommendations.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Configuration from environment
const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] ?? '')
  .split(',')
  .filter(Boolean);

// Default allowed origins for development
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

const MAX_SPEC_SIZE = parseInt(
  process.env['MAX_SPEC_SIZE'] ?? String(5 * 1024 * 1024),
  10
); // 5MB default
const MAX_JSON_DEPTH = parseInt(process.env['MAX_JSON_DEPTH'] ?? '100', 10);

/**
 * Validate JSON object depth to prevent stack overflow attacks
 */
export function validateJsonDepth(
  obj: unknown,
  maxDepth: number = MAX_JSON_DEPTH,
  currentDepth = 0
): boolean {
  if (currentDepth > maxDepth) {
    return false;
  }

  if (typeof obj !== 'object' || obj === null) {
    return true;
  }

  if (Array.isArray(obj)) {
    return obj.every((item) =>
      validateJsonDepth(item, maxDepth, currentDepth + 1)
    );
  }

  return Object.values(obj).every((value) =>
    validateJsonDepth(value, maxDepth, currentDepth + 1)
  );
}

const securityPluginImpl: FastifyPluginAsync = async (fastify) => {
  const allowedOrigins =
    ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_ORIGINS;

  fastify.log.info(
    { allowedOrigins },
    'Security plugin: configured allowed origins'
  );

  // Set body size limit
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string', bodyLimit: MAX_SPEC_SIZE },
    (req, body, done) => {
      try {
        const parsed = JSON.parse(body as string);

        // Validate depth
        if (!validateJsonDepth(parsed)) {
          done(
            new Error(`JSON depth exceeds maximum of ${MAX_JSON_DEPTH}`),
            undefined
          );
          return;
        }

        done(null, parsed);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  // Origin validation hook (per MCP spec)
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip origin check for health endpoint
    if (request.url === '/health') {
      return;
    }

    const origin = request.headers.origin;

    // If no origin header, it's likely a server-to-server request
    // In production, you may want to be stricter here
    if (!origin) {
      return;
    }

    if (!allowedOrigins.includes(origin)) {
      fastify.log.warn({ origin, allowedOrigins }, 'Origin not allowed');
      return reply.status(403).send({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Forbidden: Origin not allowed',
        },
        id: null,
      });
    }
  });

  // Log security events
  fastify.addHook('onError', async (request, reply, error) => {
    if (
      error.message.includes('JSON depth') ||
      error.message.includes('body limit')
    ) {
      fastify.log.warn(
        { error: error.message, ip: request.ip },
        'Security: potential attack detected'
      );
    }
  });
};

export const securityPlugin = fp(securityPluginImpl, {
  name: 'security',
  fastify: '5.x',
});
