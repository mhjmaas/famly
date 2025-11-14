import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toRecipeDTO } from "../lib/recipe.mapper";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";
import { validateCreateRecipe } from "../validators/create-recipe.validator";

export function createRecipeRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
    activityEventService,
  );

  /**
   * POST /v1/families/:familyId/recipes
   * Create a new recipe
   */
  router.post(
    "/",
    authenticate,
    validateCreateRecipe,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = validateObjectId(req.user.id, "userId");

        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = validateObjectId(req.params.familyId, "familyId");

        const recipe = await recipeService.createRecipe(
          familyId,
          userId,
          req.body,
        );

        res.status(201).json(toRecipeDTO(recipe));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
