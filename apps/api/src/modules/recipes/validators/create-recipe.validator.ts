import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Validates imageUrl format - accepts HTTP(S) URLs or relative paths from upload
 */
const imageUrlSchema = z
  .string()
  .max(500, "Image URL must not exceed 500 characters")
  .refine(
    (url) => {
      // Accept relative paths from upload endpoint
      if (url.startsWith("/api/images/")) {
        return true;
      }
      // Accept valid HTTP(S) URLs
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message:
        "Image URL must be a valid HTTP(S) URL or a relative path starting with /api/images/",
    },
  );

export const createRecipeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must not exceed 2000 characters"),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number of minutes")
    .min(1, "Duration must be at least 1 minute")
    .max(1440, "Duration must not exceed 1440 minutes")
    .optional(),
  imageUrl: imageUrlSchema.optional(),
  steps: z
    .array(
      z
        .string()
        .min(1, "Steps cannot be empty")
        .max(500, "Each step must not exceed 500 characters"),
    )
    .default([]),
  tags: z
    .array(z.string().min(1).max(50, "Each tag must not exceed 50 characters"))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

/**
 * Express middleware to validate create recipe request body
 */
export function validateCreateRecipe(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createRecipeSchema.parse(req.body);
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
