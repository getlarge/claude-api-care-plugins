/**
 * OAuth2 E2E Tests
 *
 * Tests the OAuth2 Authorization Code flow with Ory Hydra.
 * Uses Hydra's Admin API to programmatically complete the OAuth2 flow.
 *
 * Prerequisites:
 *   docker compose -f docker-compose.e2e.yml up -d
 *
 * Run:
 *   npm run test:e2e:oauth
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

import {
  HydraTestHelper,
  waitForHydra,
} from '../test-helpers/hydra-test-helper.js';
import { createPkceChallenge } from '../test-helpers/pkce.js';
import {
  HttpMcpTestClient,
  waitForServer,
} from '../test-helpers/http-mcp-client.js';
import { createServer } from '../server.js';

// Configuration from environment or defaults
const HYDRA_PUBLIC_URL =
  process.env['HYDRA_PUBLIC_URL'] ?? 'http://localhost:4444';
const HYDRA_ADMIN_URL =
  process.env['HYDRA_ADMIN_URL'] ?? 'http://localhost:4445';
const MCP_SERVER_PORT = 4001; // Use different port to avoid conflicts
const MCP_SERVER_URL = `http://localhost:${MCP_SERVER_PORT}`;

// Test client credentials (must match docker-compose.e2e.yml setup)
const TEST_CLIENT_ID = 'mcp-server-client';
const TEST_CLIENT_SECRET = 'mcp-server-secret';
const TEST_REDIRECT_URI = 'http://localhost:4000/oauth/callback';

describe('OAuth2 E2E Tests', () => {
  let hydraHelper: HydraTestHelper;
  let server: Awaited<ReturnType<typeof createServer>>;

  before(async () => {
    // Wait for Hydra to be available (up to 60 seconds in CI)
    console.log('Waiting for Hydra at', HYDRA_PUBLIC_URL);
    await waitForHydra(HYDRA_PUBLIC_URL, 60000);
    console.log('Hydra is ready');

    hydraHelper = new HydraTestHelper({
      hydraPublicUrl: HYDRA_PUBLIC_URL,
      hydraAdminUrl: HYDRA_ADMIN_URL,
    });

    // Disable audience validation for e2e tests (Hydra doesn't set audience by default)
    process.env['VALIDATE_AUDIENCE'] = 'false';

    // Start MCP server with OAuth enabled
    console.log('Starting MCP server on port', MCP_SERVER_PORT);
    server = await createServer(
      { port: MCP_SERVER_PORT, host: '127.0.0.1' },
      {
        enabled: true,
        projectUrl: HYDRA_PUBLIC_URL,
        jwksUri: `${HYDRA_PUBLIC_URL}/.well-known/jwks.json`,
      }
    );
    await server.start();

    // Wait for server to be ready
    await waitForServer(MCP_SERVER_URL, { timeout: 10000 });
    console.log('MCP server is ready');
  });

  after(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('OAuth2 Authorization Code Flow', () => {
    it('completes flow without PKCE', async () => {
      const { code, state } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid offline_access',
        subject: 'e2e-test-user',
        state: 'test-state-123',
      });

      assert.ok(code, 'Authorization code should be returned');
      assert.strictEqual(state, 'test-state-123', 'State should match');

      const tokens = await hydraHelper.exchangeCodeForTokens({
        code,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
      });

      assert.ok(tokens.accessToken, 'Access token should be returned');
      assert.strictEqual(
        tokens.tokenType.toLowerCase(),
        'bearer',
        'Token type should be bearer'
      );
    });

    it('completes flow with PKCE', async () => {
      const { verifier, challenge, method } = createPkceChallenge();

      const { code } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid offline_access',
        subject: 'e2e-pkce-user',
        codeChallenge: challenge,
        codeChallengeMethod: method,
      });

      assert.ok(code, 'Authorization code should be returned');

      const tokens = await hydraHelper.exchangeCodeForTokens({
        code,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
        codeVerifier: verifier,
      });

      assert.ok(tokens.accessToken, 'Access token should be returned');
      assert.ok(
        tokens.refreshToken,
        'Refresh token should be returned (offline_access scope)'
      );
    });
  });

  describe('Token Introspection', () => {
    it('introspects valid token as active', async () => {
      const { verifier, challenge, method } = createPkceChallenge();

      const { code } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid',
        subject: 'introspect-test-user',
        codeChallenge: challenge,
        codeChallengeMethod: method,
      });

      const tokens = await hydraHelper.exchangeCodeForTokens({
        code,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
        codeVerifier: verifier,
      });

      const result = await hydraHelper.introspectToken(
        tokens.accessToken,
        TEST_CLIENT_ID,
        TEST_CLIENT_SECRET
      );

      assert.strictEqual(result.active, true, 'Token should be active');
      assert.strictEqual(
        result.sub,
        'introspect-test-user',
        'Subject should match'
      );
    });

    it('introspects invalid token as inactive', async () => {
      const result = await hydraHelper.introspectToken(
        'invalid-token-that-does-not-exist',
        TEST_CLIENT_ID,
        TEST_CLIENT_SECRET
      );

      assert.strictEqual(
        result.active,
        false,
        'Invalid token should be inactive'
      );
    });
  });

  describe('MCP Server Authentication', () => {
    it('health endpoint works without authentication', async () => {
      const client = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      const health = await client.health();

      assert.strictEqual(health.status, 'ok', 'Health should be ok');
    });

    it('rejects unauthenticated tool calls', async () => {
      const client = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      // Don't call start() - we expect initialization to fail without auth

      // Try to initialize without auth - should throw with 401
      await assert.rejects(
        async () => client.start(),
        (error: Error) => {
          // Should get HTTP 401 Unauthorized
          return error.message.includes('401');
        },
        'Unauthenticated request should be rejected with 401'
      );
    });

    it('accepts authenticated tool calls and returns user info', async () => {
      // Get token
      const { verifier, challenge, method } = createPkceChallenge();
      const { code } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid',
        subject: 'mcp-test-user',
        codeChallenge: challenge,
        codeChallengeMethod: method,
      });

      const tokens = await hydraHelper.exchangeCodeForTokens({
        code,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
        codeVerifier: verifier,
      });

      // Make authenticated request
      const client = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      client.setAccessToken(tokens.accessToken);
      await client.start();

      // Call whoami tool to verify authContext is populated
      const response = await client.callTool('baume-whoami', {});

      assert.ok(!response.error, 'Authenticated request should succeed');

      const result = client.parseTextContent(response);
      assert.ok(result, 'Response should have content');
      assert.strictEqual(
        result['authenticated'],
        true,
        'Should be authenticated'
      );
      // The userId comes from the JWT 'sub' claim
      assert.strictEqual(
        result['userId'],
        'mcp-test-user',
        'User ID should match subject'
      );
    });

    it('list-rules works with valid token', async () => {
      // Get token
      const { verifier, challenge, method } = createPkceChallenge();
      const { code } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid',
        subject: 'list-rules-user',
        codeChallenge: challenge,
        codeChallengeMethod: method,
      });

      const tokens = await hydraHelper.exchangeCodeForTokens({
        code,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
        codeVerifier: verifier,
      });

      // Make authenticated request
      const client = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      client.setAccessToken(tokens.accessToken);
      await client.start();

      const response = await client.callTool('baume-list-rules', {});

      assert.ok(!response.error, 'Request should succeed');

      const result = client.parseTextContent(response);
      assert.ok(result, 'Response should have content');
      assert.ok(Array.isArray(result['rules']), 'Should return rules array');
      assert.ok((result['count'] as number) > 0, 'Should have rules');
    });
  });

  describe('Different Users', () => {
    it('different subjects get different user IDs', async () => {
      // User A
      const { code: codeA } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid',
        subject: 'user-alice',
      });

      const tokensA = await hydraHelper.exchangeCodeForTokens({
        code: codeA,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
      });

      // User B
      const { code: codeB } = await hydraHelper.completeAuthFlow({
        clientId: TEST_CLIENT_ID,
        redirectUri: TEST_REDIRECT_URI,
        scope: 'openid',
        subject: 'user-bob',
      });

      const tokensB = await hydraHelper.exchangeCodeForTokens({
        code: codeB,
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: TEST_REDIRECT_URI,
      });

      // Check User A
      const clientA = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      clientA.setAccessToken(tokensA.accessToken);
      await clientA.start();

      const responseA = await clientA.callTool('baume-whoami', {});
      const resultA = clientA.parseTextContent(responseA);

      // Check User B
      const clientB = new HttpMcpTestClient({ baseUrl: MCP_SERVER_URL });
      clientB.setAccessToken(tokensB.accessToken);
      await clientB.start();

      const responseB = await clientB.callTool('baume-whoami', {});
      const resultB = clientB.parseTextContent(responseB);

      assert.strictEqual(
        resultA?.['userId'],
        'user-alice',
        'User A should be alice'
      );
      assert.strictEqual(
        resultB?.['userId'],
        'user-bob',
        'User B should be bob'
      );
      assert.notStrictEqual(
        resultA?.['userId'],
        resultB?.['userId'],
        'Users should have different IDs'
      );
    });
  });
});
