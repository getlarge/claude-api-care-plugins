/**
 * Whoami Handler
 *
 * Returns information about the authenticated user from the OAuth2 token.
 * Used for E2E testing to verify authContext is properly populated.
 */

import type { CallToolResult } from '@getlarge/fastify-mcp';
import type { HandlerContext } from '../../types/mcp-context.js';
import type { WhoamiOutput } from '../../schemas/index.js';

/**
 * Execute the baume-whoami tool.
 * Returns the user info from the OAuth2 authContext.
 */
export async function executeWhoami(
  context: HandlerContext
): Promise<CallToolResult> {
  const { authContext } = context;

  const output: WhoamiOutput = {
    authenticated: !!authContext?.userId || !!authContext?.clientId,
    userId: authContext?.userId,
    clientId: authContext?.clientId,
    scopes: authContext?.scopes,
    tokenType: authContext?.tokenType,
    expiresAt: authContext?.expiresAt?.toISOString(),
    authorizationServer: authContext?.authorizationServer,
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(output, null, 2),
      },
    ],
    structuredContent: output,
  };
}
