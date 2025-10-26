import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";

/**
 * Middleware to verify that authenticated user has admin role in the chat
 * Requires verifyMembership middleware to run first
 *
 * Expects membership to be attached to request (req.membership)
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.membership) {
    throw HttpError.forbidden("Chat membership verification required");
  }

  if (req.membership.role !== "admin") {
    throw HttpError.forbidden("Admin role required for this operation");
  }

  next();
}
