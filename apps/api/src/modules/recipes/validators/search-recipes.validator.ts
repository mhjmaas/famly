import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const searchRecipesSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .default(10)
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val >= 1, "Limit must be at least 1")
    .refine((val) => val <= 100, "Maximum limit is 100"),
  offset: z
    .union([z.string(), z.number()])
    .optional()
    .default(0)
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => val >= 0, "Offset must be non-negative"),
});

export type SearchRecipesInput = z.infer<typeof searchRecipesSchema>;

/**
 * Express middleware to validate search recipes request body
 */
export function validateSearchRecipes(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = searchRecipesSchema.parse(req.body);
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
