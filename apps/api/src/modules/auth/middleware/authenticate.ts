import { HttpError } from "@lib/http-error";
import type { FamilyMembershipView } from "@modules/family/domain/family";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { getAuth } from "../better-auth";
import { isJWT, verifyJWT } from "./jwt-verify";

/**
 * Extended Express Request with authentication context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    birthdate?: Date;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
    language?: string;
    families?: FamilyMembershipView[];
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
  authType?: "cookie" | "bearer-jwt" | "bearer-session";
}

/**
 * Hydrate user's family memberships.
 * Uses dynamic imports to avoid circular dependency with family module.
 *
 * @param userId - The user's ID as string
 * @returns Array of family memberships or empty array on error
 */
async function hydrateFamilies(
  userId: string,
): Promise<FamilyMembershipView[]> {
  try {
    // Dynamic imports required to break circular dependency:
    // auth/middleware → family/services → family/routes → auth/middleware
    const { FamilyService } = await import(
      "@modules/family/services/family.service"
    );
    const { FamilyRepository } = await import(
      "@modules/family/repositories/family.repository"
    );
    const { FamilyMembershipRepository } = await import(
      "@modules/family/repositories/family-membership.repository"
    );

    const familyService = new FamilyService(
      new FamilyRepository(),
      new FamilyMembershipRepository(),
    );

    return await familyService.listFamiliesForUser(userId);
  } catch (_error) {
    // Gracefully handle family hydration failure
    // Don't fail authentication if family lookup fails
    return [];
  }
}

/**
 * Middleware to authenticate requests using better-auth.
 *
 * Supports three authentication flows:
 * 1. Web (Cookie-based): Session token in HTTP-only cookie → Database lookup
 * 2. Mobile/API (JWT): JWT token in Authorization header → Stateless JWKS verification (fast, no DB)
 * 3. Mobile/API (Session): Session token in Authorization header → Database lookup (for refresh)
 *
 * Token Strategy:
 * - JWT tokens (3-part format): Verified using JWKS (stateless, fast)
 * - Session tokens (short string): Verified using database (can be revoked)
 *
 * @throws {HttpError} 401 if no valid session or bearer token found
 */
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth();
    const authHeader = req.headers.authorization;
    const hasBearerToken = authHeader?.startsWith("Bearer ");

    // Extract bearer token if present
    const bearerToken = hasBearerToken ? authHeader?.substring(7) : null;

    // Strategy 1: JWT Token (stateless verification using JWKS)
    if (bearerToken && isJWT(bearerToken)) {
      try {
        const payload = await verifyJWT(bearerToken);

        // JWT payload contains user data (no DB lookup needed!)
        req.user = {
          id: payload.id as string,
          email: payload.email as string,
          name: payload.name as string,
          birthdate: new Date(payload.birthdate as string),
          emailVerified: payload.emailVerified as boolean,
          image: payload.image as string | undefined,
          createdAt: new Date(payload.createdAt as string),
          updatedAt: new Date(payload.updatedAt as string),
          language: payload.language as string | undefined,
        };

        // JWT doesn't have session info (it's stateless)
        req.session = {
          id: payload.sub as string, // JWT subject is typically the session/user ID
          userId: payload.id as string,
          expiresAt: new Date((payload.exp as number) * 1000), // JWT exp is in seconds
          ipAddress: undefined,
          userAgent: undefined,
        };

        req.authType = "bearer-jwt";

        // Hydrate families for JWT auth (requires DB lookup)
        if (req.user) {
          req.user.families = await hydrateFamilies(req.user.id);
        }

        return next();
      } catch (_error) {
        throw HttpError.unauthorized("Invalid or expired JWT token");
      }
    }

    // Strategy 2 & 3: Session token (bearer or cookie) - requires database lookup
    let headers = fromNodeHeaders(req.headers);
    if (hasBearerToken && bearerToken && !isJWT(bearerToken)) {
      // Session token in bearer header - remove cookie to force bearer auth
      const headersWithoutCookie: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase() !== "cookie" && typeof value === "string") {
          headersWithoutCookie[key] = value;
        }
      }
      headers = new Headers(headersWithoutCookie);
    }

    // Validate session using better-auth (database lookup)
    const sessionData = await auth.api.getSession({
      headers,
    });

    if (!sessionData) {
      throw HttpError.unauthorized("No valid session or bearer token found");
    }

    // Set authentication type
    req.authType = hasBearerToken ? "bearer-session" : "cookie";

    // Attach user and session to request
    // Note: sessionData.user includes custom fields from customSession plugin
    const userData = sessionData.user as typeof sessionData.user & {
      birthdate?: string | Date;
      language?: string | undefined;
    };
    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      birthdate: userData.birthdate ? new Date(userData.birthdate) : undefined,
      emailVerified: userData.emailVerified,
      image: userData.image ?? undefined,
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
      language: userData.language,
      families: req.user?.families,
    };

    req.session = {
      id: sessionData.session.id,
      userId: sessionData.session.userId,
      expiresAt: new Date(sessionData.session.expiresAt),
      ipAddress: sessionData.session.ipAddress ?? undefined,
      userAgent: sessionData.session.userAgent ?? undefined,
    };

    // Hydrate families for session-based auth
    if (req.user) {
      req.user.families = await hydrateFamilies(req.user.id);
    }

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(HttpError.unauthorized("Session validation failed"));
    }
  }
}
