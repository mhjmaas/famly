import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const updateRecipeSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(200, "Name must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description cannot be empty")
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  durationMinutes: z
    .union([
      z
        .number()
        .int("Duration must be a whole number of minutes")
        .min(1, "Duration must be at least 1 minute")
        .max(1440, "Duration must not exceed 1440 minutes"),
      z.null(),
    ])
    .optional(),
  steps: z
    .array(
      z
        .string()
        .min(1, "Steps cannot be empty")
        .max(500, "Each step must not exceed 500 characters"),
    )
    .optional(),
  tags: z
    .array(z.string().min(1).max(50, "Each tag must not exceed 50 characters"))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

/**
 * Express middleware to validate update recipe request body
 */
export function validateUpdateRecipe(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateRecipeSchema.parse(req.body);
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
