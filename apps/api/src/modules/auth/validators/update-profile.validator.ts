import { z } from "zod";

/**
 * Validator for update profile request.
 *
 * Allows users to update their name, birthdate, and language.
 * Email updates are not supported to maintain authentication integrity.
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name is too long")
      .optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format")
      .optional(),
    language: z.enum(["en-US", "nl-NL"]).optional(),
  })
  .refine(
    (value) => value.name || value.birthdate || value.language,
    "At least one field must be provided",
  );

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
