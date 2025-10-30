import { settings } from "@config/settings";
import { logger } from "@lib/logger";
import { requestPasswordResetValidator } from "@modules/auth/validators/request-password-reset.validator";
import { fromNodeHeaders } from "better-auth/node";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { getAuth } from "../better-auth";

/**
 * Request password reset route.
 *
 * Sends a password reset email with a time-limited token to the user's email address.
 * Returns the same response whether the email exists or not to prevent email enumeration.
 *
 * Request body:
 * - email: string (required, must be valid email format)
 *
 * Response (200):
 * - message: "If your email is registered, you will receive a password reset link"
 *
 * Response (400): Validation errors (invalid email format, missing email)
 */
export function createRequestPasswordResetRoute(): Router {
  const router = Router();

  router.post(
    "/request-password-reset",
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        // Validate request body
        const validationResult = requestPasswordResetValidator.safeParse(
          req.body,
        );

        if (!validationResult.success) {
          return res.status(400).json({
            error: {
              message: validationResult.error.issues[0].message,
              issues: validationResult.error.issues,
            },
          });
        }

        const { email } = validationResult.data;

        logger.info("Password reset requested", { email });

        const auth = getAuth();

        logger.debug("Calling requestPasswordReset API", { email });

        // Use better-auth's built-in requestPasswordReset method
        // This will trigger the sendResetPassword callback we configured in better-auth.ts
        const result = await auth.api.requestPasswordReset({
          body: {
            email,
            // Redirect URL where user will be sent after clicking email link
            // Frontend should handle this and extract the token from query params
            // Must be a full URL including protocol and domain
            redirectTo: `${settings.betterAuthUrl}/reset-password`,
          },
          headers: fromNodeHeaders(req.headers),
          asResponse: true,
        });

        logger.debug("requestPasswordReset API result", {
          ok: result.ok,
          status: result.status,
        });

        // Check if the request was successful
        if (!result.ok) {
          const errorData = await result.json();
          logger.warn("Password reset request failed", { errorData });
        }

        // Always return success message, even if email doesn't exist
        // This prevents email enumeration attacks
        res.status(200).json({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      } catch (error) {
        // Log error but still return success to prevent email enumeration
        logger.error("Password reset request error", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Still return success message to client
        res.status(200).json({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      }
    },
  );

  return router;
}
