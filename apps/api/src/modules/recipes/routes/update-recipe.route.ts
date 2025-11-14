import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toRecipeDTO } from "../lib/recipe.mapper";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";
import { validateUpdateRecipe } from "../validators/update-recipe.validator";

export function updateRecipeRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
  );

  /**
   * PATCH /v1/families/:familyId/recipes/:recipeId
   * Update a recipe (partial update)
   */
  router.patch(
    "/:recipeId",
    authenticate,
    validateUpdateRecipe,
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

        if (!req.params.recipeId) {
          throw HttpError.badRequest("Missing recipeId parameter");
        }

        const familyId = validateObjectId(req.params.familyId, "familyId");
        const recipeId = validateObjectId(req.params.recipeId, "recipeId");

        const recipe = await recipeService.updateRecipe(
          familyId,
          recipeId,
          userId,
          req.body,
        );

        res.status(200).json(toRecipeDTO(recipe));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
