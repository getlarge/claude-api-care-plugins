/**
 * API Key Resolution Service
 *
 * Resolves API keys from multiple sources with configurable priority.
 */

export interface ApiKeySource {
  /**
   * Direct input (e.g., tool parameter)
   */
  input?: string;

  /**
   * HTTP headers (for X-Anthropic-Key extraction)
   */
  headers?: Record<string, string | string[] | undefined>;

  /**
   * Environment variable name to check (defaults to ANTHROPIC_API_KEY)
   */
  envVar?: string;
}

/**
 * Resolve API key from multiple sources.
 *
 * Priority order:
 * 1. Direct input
 * 2. HTTP header (X-Anthropic-Key)
 * 3. ANTHROPIC_API_KEY environment variable
 * 4. CLAUDE_CODE_OAUTH_TOKEN environment variable
 * 5. Custom environment variable (if specified)
 *
 * @param source - Sources to check for API key
 * @returns Resolved API key or undefined
 */
export function resolveApiKey(source: ApiKeySource): string | undefined {
  // Priority 1: Direct input
  if (source.input) {
    return source.input;
  }

  // Priority 2: HTTP header
  const headerKey = source.headers?.['x-anthropic-key'];
  if (headerKey) {
    return Array.isArray(headerKey) ? headerKey[0] : headerKey;
  }

  // Priority 3: ANTHROPIC_API_KEY
  const anthropicKey = process.env['ANTHROPIC_API_KEY'];
  if (anthropicKey) {
    return anthropicKey;
  }

  // Priority 4: CLAUDE_CODE_OAUTH_TOKEN
  const claudeCodeToken = process.env['CLAUDE_CODE_OAUTH_TOKEN'];
  if (claudeCodeToken) {
    return claudeCodeToken;
  }

  // Priority 5: Custom environment variable
  if (source.envVar) {
    return process.env[source.envVar];
  }

  return undefined;
}

/**
 * Execute a function with a temporary API key in the environment.
 *
 * Safely sets ANTHROPIC_API_KEY, executes the function, then restores
 * the original value (or deletes if it didn't exist).
 *
 * @param apiKey - API key to set temporarily
 * @param fn - Async function to execute
 * @returns Result of the function
 */
export async function withApiKey<T>(
  apiKey: string,
  fn: () => Promise<T>
): Promise<T> {
  const envVar = 'ANTHROPIC_API_KEY';
  const originalKey = process.env[envVar];
  process.env[envVar] = apiKey;

  try {
    return await fn();
  } finally {
    if (originalKey !== undefined) {
      process.env[envVar] = originalKey;
    } else {
      delete process.env[envVar];
    }
  }
}
