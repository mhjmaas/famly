import { z } from "zod";

/**
 * Validation schema for password reset request.
 * Requires a valid email address.
 */
export const requestPasswordResetValidator = z.object({
  email: z
    .string("Email is required")
    .min(1, "Email is required")
    .email("Email must be a valid email address"),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetValidator
>;
