import { HttpError } from "@lib/http-error";
import type { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";

/**
 * Input DTO for creating a message
 */
export interface CreateMessageInput {
  chatId: string; // Chat ID in string format from API
  clientId?: string; // Optional client-supplied ID for idempotency
  body: string; // Message body, 1-8000 chars
}

/**
 * Zod schema for message creation validation
 */
const createMessageSchema = z.object({
  chatId: z
    .string()
    .min(1, "Chat ID is required")
    .refine(
      (val) => ObjectId.isValid(val),
      "Chat ID must be a valid ObjectId"
    ),
  clientId: z.string().optional(),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(8000, "Message body exceeds maximum length of 8000 characters"),
});

/**
 * Express middleware to validate create message request
 * Validates request body against schema
 *
 * On validation error: throws HttpError(400, validation message)
 * On success: attaches validated data to (req as any).validatedBody
 */
export const validateCreateMessage = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const result = createMessageSchema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Validation failed";
      throw HttpError.badRequest(message);
    }

    (req as any).validatedBody = result.data as CreateMessageInput;
    next();
  } catch (error) {
    next(error);
  }
};
