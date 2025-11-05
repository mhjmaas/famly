import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { FamilyRole } from "../domain/family";

/**
 * Zod schema for update member role payload validation
 *
 * Validates:
 * - role: Must be either Parent or Child
 */
export const updateMemberRoleSchema = z.object({
  role: z
    .nativeEnum(FamilyRole)
    .refine((val) => val === FamilyRole.Parent || val === FamilyRole.Child, {
      message: "Role must be either Parent or Child",
    }),
});

export type UpdateMemberRolePayload = z.infer<typeof updateMemberRoleSchema>;

/**
 * Express middleware to validate update member role request body
 */
export function validateUpdateMemberRole(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate and transform request body
    const validated = updateMemberRoleSchema.parse(req.body);

    // Replace request body with validated data
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
