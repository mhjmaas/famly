import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toRecipeDTOArray } from "../lib/recipe.mapper";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";
import {
  type ListRecipesInput,
  validateListRecipes,
} from "../validators/list-recipes.validator";

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
        const { limit, offset } = req.query as unknown as ListRecipesInput;

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
