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
import { validateUpdateMemberRole } from "../validators/update-member-role.validator";

/**
 * Update member role route
 *
 * PATCH /v1/families/:familyId/members/:memberId - Update a member's role
 *
 * Requires authentication and Parent role in the specified family
 * Updates an existing member's role between Parent and Child
 *
 * Request params:
 * - familyId: ObjectId string
 * - memberId: ObjectId string (the user whose role will be updated)
 *
 * Request body:
 * - role: 'Parent' | 'Child'
 *
 * Response (200): UpdateMemberRoleResponse
 * {
 *   memberId: string,
 *   familyId: string,
 *   role: 'Parent' | 'Child',
 *   updatedAt: string (ISO 8601)
 * }
 *
 * Response (400): Validation error (invalid role)
 * Response (401): Authentication required
 * Response (403): Not a parent in this family
 * Response (404): Family or member not found
 */
export function createUpdateMemberRoleRoute(): Router {
  const router = Router();

  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(
    familyRepository,
    membershipRepository,
  );

  router.patch(
    "/:familyId/members/:memberId",
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    validateUpdateMemberRole,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const familyId = new ObjectId(req.params.familyId);
        const memberId = new ObjectId(req.params.memberId);
        const { role } = req.body;

        logger.info("Updating member role via API", {
          familyId: familyId.toString(),
          memberId: memberId.toString(),
          role,
          updatedBy: req.user.id,
        });

        const result = await familyService.updateMemberRole(
          familyId,
          memberId,
          role,
        );

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
