/**
 * Hydra Test Helper
 *
 * Provides utilities for completing OAuth2 Authorization Code flow
 * programmatically using Hydra's Admin API.
 *
 * This bypasses the need for browser automation by directly accepting
 * login and consent challenges via the admin endpoints.
 */

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
}

export interface IntrospectionResult {
  active: boolean;
  sub?: string;
  clientId?: string;
  scope?: string;
  exp?: number;
  iat?: number;
  aud?: string[];
}

export interface HydraTestHelperOptions {
  hydraPublicUrl?: string;
  hydraAdminUrl?: string;
}

/**
 * Helper class for completing OAuth2 flows via Hydra Admin API.
 *
 * Instead of using browser automation, this class uses Hydra's admin
 * endpoints to accept login and consent challenges programmatically.
 */
export class HydraTestHelper {
  private hydraPublicUrl: string;
  private hydraAdminUrl: string;

  constructor(options: HydraTestHelperOptions = {}) {
    this.hydraPublicUrl = options.hydraPublicUrl ?? 'http://localhost:4444';
    this.hydraAdminUrl = options.hydraAdminUrl ?? 'http://localhost:4445';
  }

  /**
   * Start OAuth2 authorization flow and return login challenge URL.
   *
   * @returns The URL that Hydra redirects to (login provider URL with challenge)
   */
  async startAuthFlow(params: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): Promise<string> {
    const url = new URL(`${this.hydraPublicUrl}/oauth2/auth`);
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', params.scope ?? 'openid');
    url.searchParams.set('state', params.state ?? crypto.randomUUID());

    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set(
        'code_challenge_method',
        params.codeChallengeMethod ?? 'S256'
      );
    }

    const response = await fetch(url, { redirect: 'manual' });
    if (response.status !== 302 && response.status !== 303) {
      const body = await response.text();
      throw new Error(
        `Expected redirect, got ${response.status}: ${body.slice(0, 200)}`
      );
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new Error('No Location header in redirect response');
    }

    return location;
  }

  /**
   * Extract challenge parameter from redirect URL.
   *
   * @param url - The redirect URL containing the challenge
   * @param challengeType - Either 'login_challenge' or 'consent_challenge'
   * @returns The challenge string
   */
  extractChallenge(
    url: string,
    challengeType: 'login_challenge' | 'consent_challenge'
  ): string {
    const parsed = new URL(url);
    const challenge = parsed.searchParams.get(challengeType);
    if (!challenge) {
      throw new Error(`No ${challengeType} found in URL: ${url}`);
    }
    return challenge;
  }

  /**
   * Accept login challenge via admin API, return consent URL.
   *
   * After accepting login, Hydra returns a redirect URL back to /oauth2/auth
   * with a login_verifier. We need to follow that redirect to get the
   * consent challenge URL.
   *
   * @param loginChallenge - The login challenge from Hydra
   * @param subject - The user ID to authenticate as
   * @returns The consent URL (with consent_challenge parameter)
   */
  async acceptLogin(loginChallenge: string, subject: string): Promise<string> {
    const response = await fetch(
      `${this.hydraAdminUrl}/admin/oauth2/auth/requests/login/accept?login_challenge=${encodeURIComponent(loginChallenge)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          remember: false,
          remember_for: 0,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to accept login: ${response.status} ${body.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as { redirect_to: string };

    // Follow the redirect to /oauth2/auth to get consent challenge
    // Hydra will redirect to the consent URL
    const redirectResponse = await fetch(data.redirect_to, {
      redirect: 'manual',
    });
    if (redirectResponse.status !== 302 && redirectResponse.status !== 303) {
      throw new Error(
        `Expected redirect after login, got ${redirectResponse.status}`
      );
    }

    const location = redirectResponse.headers.get('location');
    if (!location) {
      throw new Error('No Location header in consent redirect');
    }

    return location;
  }

  /**
   * Accept consent challenge via admin API, return callback URL with auth code.
   *
   * After accepting consent, Hydra returns a redirect URL back to /oauth2/auth
   * with a consent_verifier. We need to follow that redirect to get the
   * final callback URL with the authorization code.
   *
   * @param consentChallenge - The consent challenge from Hydra
   * @returns The callback URL with authorization code and state
   */
  async acceptConsent(consentChallenge: string): Promise<string> {
    // First, get the consent request to see what was requested
    const getResponse = await fetch(
      `${this.hydraAdminUrl}/admin/oauth2/auth/requests/consent?consent_challenge=${encodeURIComponent(consentChallenge)}`
    );

    if (!getResponse.ok) {
      throw new Error(`Failed to get consent: ${getResponse.status}`);
    }

    const consentRequest = (await getResponse.json()) as {
      requested_scope: string[];
      requested_access_token_audience: string[];
    };

    // Accept all requested scopes
    const acceptResponse = await fetch(
      `${this.hydraAdminUrl}/admin/oauth2/auth/requests/consent/accept?consent_challenge=${encodeURIComponent(consentChallenge)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_scope: consentRequest.requested_scope,
          grant_access_token_audience:
            consentRequest.requested_access_token_audience ?? [],
          remember: false,
          remember_for: 0,
        }),
      }
    );

    if (!acceptResponse.ok) {
      const body = await acceptResponse.text();
      throw new Error(
        `Failed to accept consent: ${acceptResponse.status} ${body.slice(0, 200)}`
      );
    }

    const data = (await acceptResponse.json()) as { redirect_to: string };

    // Follow the redirect to /oauth2/auth to get the final callback
    // Hydra will redirect to the client's redirect_uri with the auth code
    const redirectResponse = await fetch(data.redirect_to, {
      redirect: 'manual',
    });
    if (redirectResponse.status !== 302 && redirectResponse.status !== 303) {
      throw new Error(
        `Expected redirect after consent, got ${redirectResponse.status}`
      );
    }

    const location = redirectResponse.headers.get('location');
    if (!location) {
      throw new Error('No Location header in callback redirect');
    }

    return location;
  }

  /**
   * Complete full OAuth2 authorization flow programmatically.
   *
   * This method:
   * 1. Starts the auth flow
   * 2. Accepts the login challenge
   * 3. Accepts the consent challenge
   * 4. Returns the authorization code
   *
   * @returns Tuple of (authorization_code, state)
   */
  async completeAuthFlow(params: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    subject: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }): Promise<{ code: string; state: string | null }> {
    // Step 1: Start auth flow
    const loginUrl = await this.startAuthFlow(params);

    // Step 2: Accept login
    const loginChallenge = this.extractChallenge(loginUrl, 'login_challenge');
    const consentUrl = await this.acceptLogin(loginChallenge, params.subject);

    // Step 3: Accept consent
    const consentChallenge = this.extractChallenge(
      consentUrl,
      'consent_challenge'
    );
    const callbackUrl = await this.acceptConsent(consentChallenge);

    // Step 4: Extract authorization code from callback URL
    const parsed = new URL(callbackUrl);
    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');

    if (!code) {
      throw new Error(`No authorization code in callback URL: ${callbackUrl}`);
    }

    return { code, state };
  }

  /**
   * Exchange authorization code for tokens.
   *
   * @returns Token response containing access_token, refresh_token, etc.
   */
  async exchangeCodeForTokens(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<OAuth2Tokens> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
    });

    if (params.codeVerifier) {
      body.set('code_verifier', params.codeVerifier);
    }

    const response = await fetch(`${this.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64')}`,
      },
      body,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} ${responseBody.slice(0, 200)}`
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  /**
   * Introspect a token to check if it's active.
   *
   * @returns Introspection response with 'active' boolean and token claims
   */
  async introspectToken(
    token: string,
    clientId: string,
    clientSecret: string
  ): Promise<IntrospectionResult> {
    const response = await fetch(
      `${this.hydraAdminUrl}/admin/oauth2/introspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({ token }),
      }
    );

    if (!response.ok) {
      throw new Error(`Introspection failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      active: boolean;
      sub?: string;
      client_id?: string;
      scope?: string;
      exp?: number;
      iat?: number;
      aud?: string[];
    };

    return {
      active: data.active,
      sub: data.sub,
      clientId: data.client_id,
      scope: data.scope,
      exp: data.exp,
      iat: data.iat,
      aud: data.aud,
    };
  }

  /**
   * Wait for Hydra to be healthy.
   *
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   * @param interval - Time between checks in milliseconds (default: 1000)
   */
  async waitForHydra(timeout = 30000, interval = 1000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(
          `${this.hydraPublicUrl}/.well-known/openid-configuration`
        );
        if (response.ok) {
          return;
        }
      } catch {
        // Hydra not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(
      `Hydra at ${this.hydraPublicUrl} did not become healthy within ${timeout}ms`
    );
  }
}

/**
 * Wait for Hydra to be available (convenience function).
 */
export async function waitForHydra(
  hydraPublicUrl = 'http://localhost:4444',
  timeout = 30000
): Promise<void> {
  const helper = new HydraTestHelper({ hydraPublicUrl });
  await helper.waitForHydra(timeout);
}
