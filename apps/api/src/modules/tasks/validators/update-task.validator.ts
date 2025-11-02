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

// Update task input schema - all fields optional
export const updateTaskSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(200, "Name must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  dueDate: z.coerce.date().optional(),
  assignment: taskAssignmentSchema.optional(),
  completedAt: z.coerce.date().nullable().optional(),
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

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Express middleware to validate update task request body
 */
export function validateUpdateTask(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateTaskSchema.parse(req.body);
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
