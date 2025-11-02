import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toRecipeDTOArray } from "../lib/recipe.mapper";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";
import { validateSearchRecipes } from "../validators/search-recipes.validator";

export function searchRecipesRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
  );

  /**
   * POST /v1/families/:familyId/recipes/search
   * Search recipes by name and description
   */
  router.post(
    "/search",
    authenticate,
    validateSearchRecipes,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = new ObjectId(req.params.familyId);
        const { query, limit = 10, offset = 0 } = req.body;

        const { recipes, total } = await recipeService.searchRecipes(
          familyId,
          userId,
          query,
          limit,
          offset,
        );

        res.status(200).json({
          recipes: toRecipeDTOArray(recipes),
          total,
          limit,
          offset,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
