/**
 * Authentication Plugin (Placeholder)
 *
 * Prepared for future Ory OIDC integration.
 * Currently a no-op that passes through all requests.
 *
 * @see https://www.ory.com/blog/mcp-server-oauth-with-ory-hydra-authentication-ai-agent-integration-guide
 */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface AuthConfig {
  /** Ory Hydra public URL for token introspection */
  oryHydraPublicUrl?: string | undefined;
  /** Ory Hydra admin URL for client management */
  oryHydraAdminUrl?: string | undefined;
  /** Required OAuth scopes for access */
  requiredScopes?: string[] | undefined;
}

// Configuration from environment
const ORY_HYDRA_PUBLIC_URL = process.env['ORY_HYDRA_PUBLIC_URL'];
const ORY_HYDRA_ADMIN_URL = process.env['ORY_HYDRA_ADMIN_URL'];
const REQUIRED_SCOPES = (process.env['REQUIRED_SCOPES'] ?? 'openid,aip:review')
  .split(',')
  .filter(Boolean);

// Extend FastifyRequest with user property for future use
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      scopes: string[];
    };
  }
}

const authPluginImpl: FastifyPluginAsync<AuthConfig> = async (
  fastify,
  options
) => {
  const config: AuthConfig = {
    oryHydraPublicUrl: options.oryHydraPublicUrl ?? ORY_HYDRA_PUBLIC_URL,
    oryHydraAdminUrl: options.oryHydraAdminUrl ?? ORY_HYDRA_ADMIN_URL,
    requiredScopes: options.requiredScopes ?? REQUIRED_SCOPES,
  };

  // If no Ory URL configured, skip authentication (MVP mode)
  if (!config.oryHydraPublicUrl) {
    fastify.log.info(
      'Auth plugin: No Ory Hydra URL configured, running in unauthenticated mode'
    );
    return;
  }

  fastify.log.info(
    {
      oryHydraPublicUrl: config.oryHydraPublicUrl,
      requiredScopes: config.requiredScopes,
    },
    'Auth plugin: Ory OIDC configured'
  );

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for health endpoint
    if (request.url === '/health') {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Unauthorized: Missing or invalid Authorization header',
        },
        id: null,
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // TODO: Implement actual token validation with Ory Hydra
    // This would use @ory/hydra-client or fetch to the introspection endpoint
    //
    // Example implementation:
    // const response = await fetch(`${config.oryHydraPublicUrl}/oauth2/introspect`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({ token }),
    // });
    // const tokenInfo = await response.json();
    //
    // if (!tokenInfo.active) {
    //   return reply.status(401).send({ error: 'Token is not active' });
    // }
    //
    // // Check required scopes
    // const tokenScopes = (tokenInfo.scope || '').split(' ');
    // const hasRequiredScopes = config.requiredScopes?.every(s => tokenScopes.includes(s));
    // if (!hasRequiredScopes) {
    //   return reply.status(403).send({ error: 'Insufficient scopes' });
    // }
    //
    // request.user = { sub: tokenInfo.sub, scopes: tokenScopes };

    fastify.log.warn(
      { token: token.slice(0, 10) + '...' },
      'Auth plugin: Token validation not implemented, passing through'
    );
  });
};

export const authPlugin = fp(authPluginImpl, {
  name: 'auth',
  fastify: '5.x',
});
