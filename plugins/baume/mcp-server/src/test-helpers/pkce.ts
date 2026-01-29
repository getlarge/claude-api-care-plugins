/**
 * PKCE (Proof Key for Code Exchange) Utilities
 *
 * Generates code verifier and challenge for OAuth2 PKCE flow.
 * See: RFC 7636 - https://tools.ietf.org/html/rfc7636
 */

import { createHash, randomBytes } from 'node:crypto';

export interface PkceChallenge {
  /** Random verifier string (43-128 chars, URL-safe base64) */
  verifier: string;
  /** SHA256 hash of verifier, URL-safe base64 encoded */
  challenge: string;
  /** Challenge method (always S256) */
  method: 'S256';
}

/**
 * Generate a PKCE code verifier and challenge.
 *
 * The verifier is a random 32-byte value encoded as URL-safe base64.
 * The challenge is the SHA256 hash of the verifier, also URL-safe base64 encoded.
 *
 * @returns PKCE verifier, challenge, and method
 */
export function createPkceChallenge(): PkceChallenge {
  // Generate 32 random bytes for the verifier
  const verifier = randomBytes(32).toString('base64url');

  // Create SHA256 hash of verifier for the challenge
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  return {
    verifier,
    challenge,
    method: 'S256',
  };
}
