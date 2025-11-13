import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Date validation: YYYY-MM-DD format
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional();

// List activity events query parameters schema
export const listEventsQuerySchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Express middleware to validate list activity events query parameters
 */
type ListEventsRequest = Request<
  Record<string, never>,
  unknown,
  unknown,
  Partial<ListEventsQuery>
>;

export function validateListEventsQuery(
  req: ListEventsRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const validated = listEventsQuerySchema.parse(req.query);
    req.query = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }
    throw error;
  }
}
