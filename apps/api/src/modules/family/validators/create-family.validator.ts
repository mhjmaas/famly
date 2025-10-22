import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Zod schema for create family payload validation
 *
 * Note: Normalization (trim, empty->null) happens in the service layer
 * to avoid duplication. Validator only checks type and max length before trimming.
 */
export const createFamilySchema = z.object({
  name: z
    .string()
    .max(200, "Family name cannot exceed 200 characters (trimmed to 120 max)")
    .optional()
    .nullable(),
});

export type CreateFamilyPayload = z.infer<typeof createFamilySchema>;

/**
 * Express middleware to validate create family request body
 */
export function validateCreateFamily(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate and transform request body
    const validated = createFamilySchema.parse(req.body);

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
