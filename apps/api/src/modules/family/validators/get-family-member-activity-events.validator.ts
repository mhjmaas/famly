import { HttpError } from "@lib/http-error";
import { listEventsQuerySchema } from "@modules/activity-events/validators/list-events.validator";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Member ID path parameter validation
const memberIdParamSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

export type GetFamilyMemberActivityEventsParams = z.infer<
  typeof memberIdParamSchema
>;
export type GetFamilyMemberActivityEventsRequest = Request<
  GetFamilyMemberActivityEventsParams,
  unknown,
  unknown,
  Partial<z.infer<typeof listEventsQuerySchema>>
>;

/**
 * Express middleware to validate family member activity events path and query parameters
 * Note: familyId validation is handled by the family router middleware
 */
export function validateGetFamilyMemberActivityEventsParams(
  req: GetFamilyMemberActivityEventsRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate path parameters
    const paramsValidation = memberIdParamSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      const firstError = paramsValidation.error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }

    // Validate query parameters
    const queryValidation = listEventsQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      const firstError = queryValidation.error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }

    req.query = queryValidation.data;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw HttpError.badRequest("Invalid request parameters");
  }
}
