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
import { validateListRecipes } from "../validators/list-recipes.validator";

export function listRecipesRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
  );

  /**
   * GET /v1/families/:familyId/recipes
   * List all recipes for a family with pagination
   */
  router.get(
    "/",
    authenticate,
    validateListRecipes,
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
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const offset = parseInt(req.query.offset as string, 10) || 0;

        const { recipes, total } = await recipeService.listRecipes(
          familyId,
          userId,
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
