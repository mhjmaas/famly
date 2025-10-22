import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { FamilyRole } from "../domain/family";
import { FamilyRepository } from "../repositories/family.repository";
import { FamilyMembershipRepository } from "../repositories/family-membership.repository";
import { FamilyService } from "../services/family.service";

/**
 * Remove family member route
 *
 * DELETE /v1/families/:familyId/members/:memberId - Remove a member from a family
 *
 * Requires authentication and Parent role in the specified family
 * Removes the member and returns 204 on success.
 *
 * Response (204): Member removed
 *
 * Response (400): Validation error (invalid IDs)
 * Response (401): Authentication required
 * Response (403): Not a parent in this family
 * Response (404): Family or member not found
 * Response (409): Guardrail preventing removal (e.g., last parent)
 */
export function createRemoveMemberRoute(): Router {
  const router = Router();

  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(
    familyRepository,
    membershipRepository,
  );

  router.delete(
    "/:familyId/members/:memberId",
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        let familyId: ObjectId;
        let memberId: ObjectId;
        const removedBy = new ObjectId(req.user.id);

        try {
          familyId = new ObjectId(req.params.familyId);
        } catch {
          throw HttpError.badRequest("Invalid family identifier");
        }

        try {
          memberId = new ObjectId(req.params.memberId);
        } catch {
          throw HttpError.badRequest("Invalid member identifier");
        }

        logger.info("Removing family member via API", {
          familyId: familyId.toString(),
          memberId: memberId.toString(),
          removedBy: removedBy.toString(),
        });

        await familyService.removeFamilyMember(familyId, removedBy, memberId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
