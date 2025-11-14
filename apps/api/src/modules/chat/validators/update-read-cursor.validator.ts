import { HttpError } from "@lib/http-error";
import type { ObjectIdString } from "@lib/objectid-utils";
import { zodObjectId } from "@lib/zod-objectid";
import type { NextFunction, Response } from "express";
import { z } from "zod";

/**
 * Input DTO for updating read cursor
 */
export interface UpdateReadCursorInput {
  messageId: ObjectIdString; // Message ID to mark as read
}

/**
 * Zod schema for update read cursor validation
 */
const updateReadCursorSchema = z.object({
  messageId: zodObjectId,
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
