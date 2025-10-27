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

// Schedule configuration schema
export const scheduleSchema = z
  .object({
    daysOfWeek: z
      .array(
        z
          .number()
          .int()
          .min(0, "Day must be between 0 and 6")
          .max(6, "Day must be between 0 and 6"),
      )
      .min(1, "At least one day of week is required"),
    weeklyInterval: z.union(
      [z.literal(1), z.literal(2), z.literal(3), z.literal(4)],
      {
        message: "Weekly interval must be between 1 and 4",
      },
    ),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  );

// Time of day validation (HH:mm format)
export const timeOfDaySchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    "Time must be in HH:mm format (00:00 to 23:59)",
  );

// Update schedule input schema - all fields optional
export const updateScheduleSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200, "Name must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  assignment: taskAssignmentSchema.optional(),
  schedule: scheduleSchema.optional(),
  timeOfDay: timeOfDaySchema.optional(),
  metadata: z
    .object({
      karma: z
        .number()
        .int("Karma must be an integer")
        .min(1, "Karma must be at least 1")
        .max(1000, "Karma cannot exceed 1000")
        .optional(),
    })
    .optional(),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

/**
 * Express middleware to validate update schedule request body
 */
export function validateUpdateSchedule(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = updateScheduleSchema.parse(req.body);
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
