import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { AI_SENDER_ID } from "../lib/constants";

/**
 * Input DTO for creating a message
 */
export interface CreateMessageInput {
  clientId?: string; // Optional client-supplied ID for idempotency
  body: string; // Message body, 1-8000 chars
  senderId?: string; // Optional sender ID for AI messages (must be AI_SENDER_ID)
}

/**
 * Zod schema for message creation validation
 */
const createMessageSchema = z.object({
  clientId: z.string().optional(),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(100000, "Message body exceeds maximum length of 100KB"),
  senderId: z
    .string()
    .refine((val) => val === AI_SENDER_ID, {
      message: `senderId must be '${AI_SENDER_ID}' for AI messages`,
    })
    .optional(),
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
