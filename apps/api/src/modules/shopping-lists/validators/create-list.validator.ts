import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const createListSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
  items: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "Item name is required")
          .max(200, "Item name must not exceed 200 characters"),
      }),
    )
    .optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;

/**
 * Express middleware to validate create shopping list request body
 */
export function validateCreateList(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createListSchema.parse(req.body);
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
