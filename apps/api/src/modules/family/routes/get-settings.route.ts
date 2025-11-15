import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { FamilySettingsRepository } from "../repositories/family-settings.repository";
import { FamilySettingsService } from "../services/family-settings.service";

/**
 * Get family settings route
 *
 * GET /v1/families/:familyId/settings - Get settings for a family
 *
 * Requires authentication and family membership (any role)
 * Returns default settings (all features enabled) if none exist
 *
 * Response (200): FamilySettingsView
 * Response (401): Authentication required
 * Response (403): Family membership required
 * Response (404): Family not found
 */
export function createGetSettingsRoute(): Router {
  const router = Router();

  const settingsRepository = new FamilySettingsRepository();
  const settingsService = new FamilySettingsService(settingsRepository);

  router.get(
    "/:familyId/settings",
    authenticate,
    authorizeFamilyRole({
      allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
    }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { familyId } = req.params;

        logger.info("Getting family settings via API", {
          familyId,
          userId: req.user.id,
        });

        const settings = await settingsService.getSettings(familyId);

        res.status(200).json(settings);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
