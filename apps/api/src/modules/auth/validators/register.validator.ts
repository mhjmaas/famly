import { z } from "zod";

/**
 * Validation schema for user registration.
 * Requires email, password, name, and birthdate (ISO 8601 format).
 */
export const registerValidator = z.object({
  email: z
    .string("Email is required")
    .email("Email must be a valid email address")
    .min(1, "Email is required"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters"),
  name: z
    .string("Name is required")
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
  birthdate: z
    .string("Birthdate is required")
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      "Birthdate must be in ISO 8601 format (YYYY-MM-DD)",
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      "Birthdate must be a valid date",
    ),
  language: z.enum(["en-US", "nl-NL"]).optional(),
});

export type RegisterInput = z.infer<typeof registerValidator>;
