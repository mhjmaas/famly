import { HttpError } from "@lib/http-error";
import type { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Input DTO for updating read cursor
 */
export interface UpdateReadCursorInput {
  messageId: string; // Message ID to mark as read
}

/**
 * Zod schema for update read cursor validation
 */
const updateReadCursorSchema = z.object({
  messageId: z
    .string()
    .min(1, "Message ID is required")
    .refine(
      (val) => ObjectId.isValid(val),
      "Message ID must be a valid ObjectId",
    ),
});

/**
 * Express middleware to validate update read cursor request
 * Validates request body against schema
 *
 * On validation error: throws HttpError(400, validation message)
 * On success: attaches validated data to (req as any).validatedBody
 */
export const validateUpdateReadCursor = (
  req: any,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const result = updateReadCursorSchema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Validation failed";
      throw HttpError.badRequest(message);
    }

    (req as any).validatedBody = result.data as UpdateReadCursorInput;
    next();
  } catch (error) {
    next(error);
  }
};
