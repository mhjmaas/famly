import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const updateListSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters")
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
});

export type UpdateListInput = z.infer<typeof updateListSchema>;

/**
 * Express middleware to validate update shopping list request body
 */
export function validateUpdateList(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateListSchema.parse(req.body);
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
