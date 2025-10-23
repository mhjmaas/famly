import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

// ObjectId string validation
const objectIdSchema = z
  .string()
  .refine(
    (val) => ObjectId.isValid(val),
    "Invalid user ID format"
  );

// Add members input schema
export const addMembersSchema = z.object({
  userIds: z
    .array(objectIdSchema)
    .min(1, "At least one user ID is required")
    .refine(
      (ids: string[]) => {
        // User IDs must be unique
        const uniqueIds = new Set(ids);
        return uniqueIds.size === ids.length;
      },
      "User IDs must be unique"
    ),
});

export type AddMembersInput = z.infer<typeof addMembersSchema>;

/**
 * Express middleware to validate add members request body
 */
export function validateAddMembers(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = addMembersSchema.parse(req.body);
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
