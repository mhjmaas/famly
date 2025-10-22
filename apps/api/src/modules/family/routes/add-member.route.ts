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
import { validateAddFamilyMember } from "../validators/add-family-member.validator";

/**
 * Add family member route
 *
 * POST /v1/families/:familyId/members - Add a member to a family
 *
 * Requires authentication and Parent role in the specified family
 * Creates a new user account and links them to the family
 * The new user is NOT auto-logged in (no tokens issued)
 *
 * Request params:
 * - familyId: ObjectId string
 *
 * Request body:
 * - email: string (valid email, normalized to lowercase)
 * - password: string (min 8 chars)
 * - role: 'Parent' | 'Child'
 *
 * Response (201): AddFamilyMemberResult
 *
 * Response (400): Validation error or user creation failed
 * Response (401): Authentication required
 * Response (403): Not a parent in this family
 * Response (404): Family not found
 * Response (409): User already member of this family
 */
export function createAddMemberRoute(): Router {
  const router = Router();

  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(
    familyRepository,
    membershipRepository,
  );

  router.post(
    "/:familyId/members",
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    validateAddFamilyMember,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const familyId = new ObjectId(req.params.familyId);
        const addedBy = new ObjectId(req.user.id);

        logger.info("Adding family member via API", {
          familyId: familyId.toString(),
          addedBy: addedBy.toString(),
          role: req.body.role,
        });

        const result = await familyService.addFamilyMember(
          familyId,
          addedBy,
          req.body,
        );

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
