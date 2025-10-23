import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Date validation: YYYY-MM-DD format
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Update diary entry input schema
export const updateEntrySchema = z.object({
  date: dateSchema.optional(),
  entry: z
    .string()
    .max(10000, "Entry text must not exceed 10,000 characters")
    .optional(),
});

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

/**
 * Express middleware to validate update diary entry request body
 */
export function validateUpdateEntry(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateEntrySchema.parse(req.body);
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
