import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Custom ObjectId validator
const objectIdSchema = z.string().refine((val) => ObjectId.isValid(val), {
  message: "Invalid ObjectId format",
});

// Task assignment schema - discriminated union
const taskAssignmentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("member"),
    memberId: objectIdSchema,
  }),
  z.object({
    type: z.literal("role"),
    role: z.enum(["parent", "child"]),
  }),
  z.object({
    type: z.literal("unassigned"),
  }),
]);

// Create task input schema
export const createTaskSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must not exceed 200 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  dueDate: z.coerce.date().optional(),
  assignment: taskAssignmentSchema,
  metadata: z
    .object({
      karma: z
        .number()
        .int("Karma must be an integer")
        .min(1, "Karma must be at least 1")
        .max(1000, "Karma cannot exceed 1000")
        .optional(),
      claimId: z.string().optional(),
    })
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Express middleware to validate create task request body
 */
export function validateCreateTask(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createTaskSchema.parse(req.body);
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
