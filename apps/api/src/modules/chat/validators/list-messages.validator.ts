import { HttpError } from "@lib/http-error";
import type { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Pagination parameters for listing messages
 */
export interface ListMessagesQuery {
  before?: ObjectId; // Cursor for pagination (message ID)
  limit: number; // Max messages to return (default 50, max 200)
}

/**
 * Zod schema for list messages query validation
 */
const listMessagesSchema = z.object({
  before: z
    .string()
    .optional()
    .refine(
      (val) => !val || ObjectId.isValid(val),
      "Before cursor must be a valid ObjectId",
    ),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(200, "Limit must not exceed 200")
    .default(50),
});

/**
 * Express middleware to validate list messages query parameters
 * Validates query params against schema
 *
 * On validation error: throws HttpError(400, validation message)
 * On success: attaches parsed pagination params to (req as any).paginationParams
 */
export const validateListMessages = (
  req: any,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const queryData = {
      before: req.query.before,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    };

    const result = listMessagesSchema.safeParse(queryData);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Validation failed";
      throw HttpError.badRequest(message);
    }

    const params: ListMessagesQuery = {
      before: result.data.before ? new ObjectId(result.data.before) : undefined,
      limit: result.data.limit,
    };

    (req as any).paginationParams = params;
    next();
  } catch (error) {
    next(error);
  }
};
