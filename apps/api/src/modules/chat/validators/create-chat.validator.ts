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

// Create chat input schema
export const createChatSchema = z
  .object({
    type: z.enum(["dm", "group"]),
    memberIds: z
      .array(objectIdSchema)
      .min(1, "At least one member is required")
      .refine(
        (ids: string[]) => {
          // Member IDs must be unique
          const uniqueIds = new Set(ids);
          return uniqueIds.size === ids.length;
        },
        "Member IDs must be unique"
      ),
    title: z.string().optional().nullable(),
  })
  .refine(
    (data: unknown): data is { type: "dm" | "group"; memberIds: string[]; title?: string | null } => {
      const obj = data as any;
      // For DMs: exactly 1 member (creator + 1 = 2 total)
      if (obj.type === "dm") {
        return obj.memberIds.length === 1;
      }
      // For groups: minimum 1 member (creator + 1+ = 2+ total)
      return obj.memberIds.length >= 1;
    },
    {
      message: "Invalid member count for chat type",
      path: ["memberIds"],
    }
  )
  .refine(
    (data: any) => {
      // Title not allowed for DMs
      if (data.type === "dm" && data.title) {
        return false;
      }
      return true;
    },
    {
      message: "Title is not allowed for direct messages",
      path: ["title"],
    }
  );

export type CreateChatInput = z.infer<typeof createChatSchema>;

/**
 * Express middleware to validate create chat request body
 */
export function validateCreateChat(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = createChatSchema.parse(req.body);
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
