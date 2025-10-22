import { jwtVerify, createRemoteJWKSet, JWTVerifyResult } from "jose";
import { settings } from "@config/settings";

/**
 * JWT verification using JWKS (stateless, no database lookup)
 */

// Cache JWKS for performance (keys don't change frequently)
// In test environment, always fetch fresh to avoid stale key issues
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  // In test environment, don't cache JWKS to prevent stale key issues
  if (settings.isTest) {
    return createRemoteJWKSet(
      new URL(`${settings.betterAuthUrl}/v1/auth/jwks`),
    );
  }

  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(
      new URL(`${settings.betterAuthUrl}/v1/auth/jwks`),
    );
  }
  return jwksCache;
}

/**
 * Clear the JWKS cache.
 * Useful for testing or when keys are rotated.
 */
export function clearJWKSCache(): void {
  jwksCache = null;
}

/**
 * Verify a JWT token using JWKS (stateless verification)
 *
 * @param token - The JWT token to verify
 * @returns The decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(
  token: string,
): Promise<JWTVerifyResult["payload"]> {
  try {
    const JWKS = getJWKS();

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: settings.betterAuthUrl,
      audience: settings.betterAuthUrl,
    });

    return payload;
  } catch (error) {
    throw new Error(
      `JWT verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if a token is a JWT (three parts separated by dots)
 * vs a session token (single string)
 */
export function isJWT(token: string): boolean {
  return token.split(".").length === 3;
}
