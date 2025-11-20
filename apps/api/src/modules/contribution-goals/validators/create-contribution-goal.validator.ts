import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

// Create contribution goal input schema
export const createContributionGoalSchema = z.object({
  memberId: objectIdSchema,
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters"),
  maxKarma: z
    .number()
    .int("Max karma must be an integer")
    .min(1, "Max karma must be at least 1")
    .max(10000, "Max karma cannot exceed 10000"),
});

export type CreateContributionGoalInput = z.infer<
  typeof createContributionGoalSchema
>;

/**
 * Express middleware to validate create contribution goal request body
 */
export function validateCreateContributionGoal(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createContributionGoalSchema.parse(req.body);
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
