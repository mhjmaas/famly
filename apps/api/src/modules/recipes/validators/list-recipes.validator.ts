import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const listRecipesSchema = z.object({
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Limit must be at least 1")
    .refine((val) => val <= 100, "Maximum limit is 100"),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, "Offset must be non-negative"),
});

export type ListRecipesInput = z.infer<typeof listRecipesSchema>;

/**
 * Express middleware to validate list recipes query parameters
 */
export function validateListRecipes(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = listRecipesSchema.parse(req.query);
    req.query = validated as any;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }
    throw error;
  }
}
