import { z } from "zod";

/**
 * Validator for update profile request.
 *
 * Allows users to update their name and birthdate.
 * Email updates are not supported to maintain authentication integrity.
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format"),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
