import { jwtVerify, createRemoteJWKSet, JWTVerifyResult } from 'jose';
import { settings } from '@config/settings';

/**
 * JWT verification using JWKS (stateless, no database lookup)
 */

// Cache JWKS for performance (keys don't change frequently)
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(
      new URL(`${settings.betterAuthUrl}/v1/auth/jwks`)
    );
  }
  return jwksCache;
}

/**
 * Verify a JWT token using JWKS (stateless verification)
 * 
 * @param token - The JWT token to verify
 * @returns The decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(token: string): Promise<JWTVerifyResult['payload']> {
  try {
    const JWKS = getJWKS();
    
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: settings.betterAuthUrl,
      audience: settings.betterAuthUrl,
    });
    
    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a token is a JWT (three parts separated by dots)
 * vs a session token (single string)
 */
export function isJWT(token: string): boolean {
  return token.split('.').length === 3;
}
