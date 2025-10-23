import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Date validation: YYYY-MM-DD format
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Create diary entry input schema
export const createEntrySchema = z.object({
  date: dateSchema,
  entry: z
    .string()
    .min(1, "Entry text is required")
    .max(10000, "Entry text must not exceed 10,000 characters"),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

/**
 * Express middleware to validate create diary entry request body
 */
export function validateCreateEntry(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createEntrySchema.parse(req.body);
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
