import { HttpError } from "@lib/http-error";
import type { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Query parameters for searching messages
 */
export interface SearchMessagesQuery {
  q: string; // Search query (required)
  chatId?: ObjectId; // Optional chat ID to limit search
  cursor?: ObjectId; // Pagination cursor
  limit: number; // Max results (default 20, max 100)
}

/**
 * Zod schema for search messages query validation
 */
const searchMessagesSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  chatId: z
    .string()
    .optional()
    .refine(
      (val) => !val || ObjectId.isValid(val),
      "Chat ID must be a valid ObjectId",
    ),
  cursor: z
    .string()
    .optional()
    .refine(
      (val) => !val || ObjectId.isValid(val),
      "Cursor must be a valid ObjectId",
    ),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(20),
});

/**
 * Express middleware to validate search messages query parameters
 * Validates query params against schema
 *
 * On validation error: throws HttpError(400, validation message)
 * On success: attaches parsed params to (req as any).searchParams
 */
export const validateSearchMessages = (
  req: any,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const queryData = {
      q: req.query.q,
      chatId: req.query.chatId,
      cursor: req.query.cursor,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
    };

    const result = searchMessagesSchema.safeParse(queryData);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Validation failed";
      throw HttpError.badRequest(message);
    }

    const params: SearchMessagesQuery = {
      q: result.data.q,
      chatId: result.data.chatId ? new ObjectId(result.data.chatId) : undefined,
      cursor: result.data.cursor ? new ObjectId(result.data.cursor) : undefined,
      limit: result.data.limit,
    };

    (req as any).searchParams = params;
    next();
  } catch (error) {
    next(error);
  }
};
