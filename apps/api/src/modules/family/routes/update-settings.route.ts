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
import { validateUpdateFamilySettings } from "../validators/family-settings.validator";

/**
 * Update family settings route
 *
 * PUT /v1/families/:familyId/settings - Update settings for a family
 *
 * Requires authentication and parent role
 * Upserts settings (creates if not exists)
 *
 * Request body:
 * - enabledFeatures: string[] (array of feature keys)
 * - aiSettings: object (optional, API endpoint config)
 *
 * Response (200): FamilySettingsView
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Parent role required
 * Response (404): Family not found
 */
export function createUpdateSettingsRoute(): Router {
  const router = Router();

  const settingsRepository = new FamilySettingsRepository();
  const settingsService = new FamilySettingsService(settingsRepository);

  router.put(
    "/:familyId/settings",
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
    validateUpdateFamilySettings,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { familyId } = req.params;

        logger.info("Updating family settings via API", {
          familyId,
          userId: req.user.id,
          enabledFeaturesCount: req.body.enabledFeatures?.length,
          hasAISettings: !!req.body.aiSettings,
        });

        const settings = await settingsService.updateSettings(
          familyId,
          req.body,
        );

        res.status(200).json(settings);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
