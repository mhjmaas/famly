import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { NextFunction, Request, Response } from "express";

/**
 * Query parameters for listing chats with pagination
 */
export interface ListChatsQuery {
  cursor?: string; // Optional pagination cursor (chat _id)
  limit?: string; // Optional limit (default 20, max 100)
}

/**
 * Middleware validator for GET /chats query parameters
 * Validates:
 * - cursor: optional, must be valid ObjectId if provided
 * - limit: optional, must be numeric, default 20, max 100
 */
export function validateListChats(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const { cursor, limit } = req.query as Record<string, string | undefined>;

    // Validate cursor if provided
    let normalizedCursor: string | undefined;
    if (cursor !== undefined && cursor !== "") {
      normalizedCursor = validateObjectId(cursor, "cursor");
      req.query.cursor = normalizedCursor;
    } else if (cursor === "") {
      throw HttpError.badRequest(
        "Invalid cursor format. Must be a valid ObjectId.",
      );
    }

    // Validate and parse limit
    let parsedLimit = 20; // Default
    if (limit !== undefined && limit !== "") {
      const limitNum = Number.parseInt(limit, 10);
      if (Number.isNaN(limitNum) || !Number.isInteger(limitNum)) {
        throw HttpError.badRequest("Limit must be a valid number.");
      }
      if (limitNum < 1) {
        throw HttpError.badRequest("Limit must be at least 1.");
      }
      if (limitNum > 100) {
        throw HttpError.badRequest("Limit must not exceed 100.");
      }
      parsedLimit = limitNum;
    } else if (limit === "") {
      throw HttpError.badRequest("Limit must be a valid number.");
    }

    // Store parsed values in req for use in route handler
    (req as any).paginationParams = {
      cursor: normalizedCursor,
      limit: parsedLimit,
    };

    next();
  } catch (error) {
    next(error);
  }
}
