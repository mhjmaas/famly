import { z } from "zod";

/**
 * Validation schema for password reset completion.
 * Requires reset token and new password meeting minimum strength requirements.
 */
export const resetPasswordValidator = z.object({
  token: z.string("Reset token is required").min(1, "Reset token is required"),
  newPassword: z
    .string("New password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordValidator>;
