import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Add deduction input schema
export const addDeductionSchema = z.object({
  amount: z
    .number()
    .int("Amount must be an integer")
    .positive("Amount must be a positive number"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must not exceed 500 characters"),
});

export type AddDeductionInput = z.infer<typeof addDeductionSchema>;

/**
 * Express middleware to validate add deduction request body
 */
export function validateAddDeduction(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = addDeductionSchema.parse(req.body);
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
