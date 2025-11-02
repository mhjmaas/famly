import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Zod schema for grant karma payload validation
 *
 * Validates:
 * - userId: Valid ObjectId string format
 * - amount: Integer between -100,000 and 100,000 (positive for grants, negative for deductions/penalties)
 * - description: Optional string, max 500 characters
 */
export const grantKarmaSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required")
    .refine((val) => ObjectId.isValid(val), {
      message: "Invalid user ID format",
    }),

  amount: z
    .number()
    .int("Amount must be an integer")
    .min(-100000, "Amount cannot be less than -100,000")
    .max(100000, "Amount cannot exceed 100,000")
    .refine((val) => val !== 0, {
      message: "Amount cannot be zero",
    }),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

export type GrantKarmaPayload = z.infer<typeof grantKarmaSchema>;

/**
 * Express middleware to validate grant karma request body
 */
export function validateGrantKarma(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate and transform request body
    const validated = grantKarmaSchema.parse(req.body);

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
