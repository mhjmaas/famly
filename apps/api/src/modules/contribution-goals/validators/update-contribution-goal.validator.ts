import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Update contribution goal input schema (all fields optional)
export const updateContributionGoalSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title must not exceed 200 characters")
      .optional(),
    description: z
      .string()
      .max(2000, "Description must not exceed 2000 characters")
      .optional(),
    maxKarma: z
      .number()
      .int("Max karma must be an integer")
      .min(1, "Max karma must be at least 1")
      .max(10000, "Max karma cannot exceed 10000")
      .optional(),
    recurring: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateContributionGoalInput = z.infer<
  typeof updateContributionGoalSchema
>;

/**
 * Express middleware to validate update contribution goal request body
 */
export function validateUpdateContributionGoal(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateContributionGoalSchema.parse(req.body);
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
