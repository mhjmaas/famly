import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(200, "Item name must not exceed 200 characters")
    .optional(),
  checked: z.boolean().optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/**
 * Express middleware to validate update item request body
 */
export function validateUpdateItem(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateItemSchema.parse(req.body);
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
