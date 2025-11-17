import { z } from "zod";

/**
 * Validator for change password requests.
 *
 * Enforces minimum length and ensures the new password differs from the current password.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters long"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long"),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
