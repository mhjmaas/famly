import { logger } from "@lib/logger";
import { resetPasswordValidator } from "@modules/auth/validators/reset-password.validator";
import { fromNodeHeaders } from "better-auth/node";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { getAuth } from "../better-auth";

/**
 * Reset password route.
 *
 * Completes the password reset flow by validating the token and updating the user's password.
 * Automatically invalidates all existing sessions for security.
 *
 * Request body:
 * - token: string (required, from password reset email)
 * - newPassword: string (required, minimum 8 characters)
 *
 * Response (200):
 * - message: "Password reset successful"
 *
 * Response (400): Validation errors or invalid/expired token
 */
export function createResetPasswordRoute(): Router {
  const router = Router();

  router.post(
    "/reset-password",
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        // Validate request body
        const validationResult = resetPasswordValidator.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            error: {
              message: validationResult.error.issues[0].message,
              issues: validationResult.error.issues,
            },
          });
        }

        const { token, newPassword } = validationResult.data;

        logger.info("Password reset attempt", {
          hasToken: Boolean(token),
          passwordLength: newPassword.length,
        });

        const auth = getAuth();

        // Use better-auth's built-in resetPassword method
        const result = await auth.api.resetPassword({
          body: {
            token,
            newPassword,
          },
          headers: fromNodeHeaders(req.headers),
        });

        // Better Auth returns various error responses for invalid tokens
        // Check if the reset was successful
        if (result.error) {
          logger.warn("Password reset failed", {
            error: result.error.message,
            status: result.error.status,
          });

          // Parse the error and return appropriate message
          const errorMessage =
            result.error.status === 400
              ? result.error.message ||
                "Invalid or expired reset token. Please request a new password reset."
              : "Failed to reset password. Please try again.";

          return res.status(400).json({
            error: {
              message: errorMessage,
            },
          });
        }

        logger.info("Password reset successful");

        res.status(200).json({
          message: "Password reset successful",
        });
      } catch (error) {
        logger.error("Password reset error", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Return generic error to client
        return res.status(400).json({
          error: {
            message:
              "Failed to reset password. The token may be invalid or expired.",
          },
        });
      }
    },
  );

  return router;
}
