import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { FamilyRepository } from "../repositories/family.repository";
import { FamilyMembershipRepository } from "../repositories/family-membership.repository";
import { FamilyService } from "../services/family.service";
import { validateCreateFamily } from "../validators/create-family.validator";

/**
 * Create family route
 *
 * POST /v1/families - Create a new family
 *
 * Requires authentication
 * Creates a family and links the authenticated user as Parent
 *
 * Request body:
 * - name: string | null (optional, max 120 chars, trimmed)
 *
 * Response (201): FamilyMembershipView
 *
 * Response (400): Validation error
 * Response (401): Authentication required
 */
export function createCreateFamilyRoute(): Router {
  const router = Router();

  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(
    familyRepository,
    membershipRepository,
  );

  router.post(
    "/",
    authenticate,
    validateCreateFamily,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        logger.info(`Creating family via API with name: ${req.body.name}`);

        const result = await familyService.createFamily(userId, req.body);

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
