import { HttpError } from "@lib/http-error";
import { zodObjectId } from "@lib/zod-objectid";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { FamilyRole } from "../domain/family";

/**
 * Zod schema for add family member route params validation
 *
 * Validates:
 * - familyId: Must be a valid ObjectId format
 */
export const addFamilyMemberParamsSchema = z.object({
  familyId: zodObjectId,
});

/**
 * Zod schema for add family member payload validation
 *
 * Validates:
 * - email: Valid email format, normalized to lowercase
 * - password: Minimum 8 characters (better-auth will enforce additional rules)
 * - name: Display name, required, max 255 characters
 * - birthdate: ISO 8601 format (YYYY-MM-DD), required, must be valid date
 * - role: Must be either Parent or Child
 */
export const addFamilyMemberSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email cannot exceed 255 characters"),
  ),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),

  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),

  birthdate: z
    .string()
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      "Birthdate must be in ISO 8601 format (YYYY-MM-DD)",
    )
    .refine(
      (val) => !Number.isNaN(new Date(val).getTime()),
      "Birthdate must be a valid date",
    ),

  role: z
    .nativeEnum(FamilyRole)
    .refine((val) => val === FamilyRole.Parent || val === FamilyRole.Child, {
      message: "Role must be either Parent or Child",
    }),
});

export type AddFamilyMemberPayload = z.infer<typeof addFamilyMemberSchema>;

/**
 * Express middleware to validate add family member request body and params
 */
export function validateAddFamilyMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate route params
    const validatedParams = addFamilyMemberParamsSchema.parse(req.params);
    req.params = validatedParams;

    // Validate and transform request body
    const validated = addFamilyMemberSchema.parse(req.body);

    // Replace request body with validated data
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }
    throw error;
  }
}
