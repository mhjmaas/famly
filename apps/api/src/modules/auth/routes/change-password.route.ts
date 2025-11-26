import { authLimiter } from "@middleware/rate-limiter";
import { HttpError } from "@lib/http-error";
import { fromNodeHeaders } from "better-auth/node";
import { type NextFunction, type Response, Router } from "express";
import { getAuth } from "../better-auth";
import {
  type AuthenticatedRequest,
  authenticate,
} from "../middleware/authenticate";
import {
  type ChangePasswordRequest,
  changePasswordSchema,
} from "../validators/change-password.validator";

/**
 * Change password route using better-auth's changePassword API.
 *
 * Request headers:
 * - Cookie: session=<session-token> (for web)
 * - Authorization: Bearer <session token> (for mobile/API)
 *
 * Request body:
 * - currentPassword: string (required, >= 8 characters)
 * - newPassword: string (required, >= 8 characters, must differ)
 * - revokeOtherSessions: boolean (optional, forced to true internally)
 *
 * Response (204): Password updated, caller must reauthenticate
 * Response (400): Validation error
 * Response (401): Invalid credentials or missing session
 */
export function createChangePasswordRoute(): Router {
  const router = Router();

  router.post(
    "/change-password",
    authLimiter,
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const validation = changePasswordSchema.safeParse(req.body);
        if (!validation.success) {
          res.status(400).json({
            error: "Validation failed",
            details: validation.error.format(),
          });
          return;
        }

        const { currentPassword, newPassword }: ChangePasswordRequest =
          validation.data;

        const auth = getAuth();
        const betterAuthResponse = await auth.api.changePassword({
          body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          },
          headers: fromNodeHeaders(req.headers),
          asResponse: true,
        });

        if (!betterAuthResponse.ok) {
          let errorBody: unknown;
          try {
            errorBody = await betterAuthResponse.json();
          } catch {
            errorBody = undefined;
          }

          const {
            error: errorText,
            message,
            code,
          } = (errorBody as {
            error?: string;
            message?: string;
            code?: string;
          }) ?? {};
          const errorMessage = errorText || message;
          const normalizedCode = code?.toUpperCase();
          const normalizedMessage = errorMessage?.toLowerCase();
          const isInvalidCurrentPassword =
            normalizedCode === "INVALID_PASSWORD" ||
            normalizedMessage?.includes("invalid password");

          if (
            betterAuthResponse.status === 401 ||
            (betterAuthResponse.status === 400 && isInvalidCurrentPassword)
          ) {
            throw HttpError.unauthorized(
              errorMessage || "Invalid current password",
            );
          }

          if (betterAuthResponse.status === 400) {
            throw HttpError.badRequest(
              errorMessage || "Invalid password payload",
            );
          }

          throw HttpError.internalServerError(
            errorMessage || "Failed to update password",
          );
        }

        const setCookieHeader = betterAuthResponse.headers.get("set-cookie");
        if (setCookieHeader) {
          res.setHeader("set-cookie", setCookieHeader);
        }

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
