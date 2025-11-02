import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toRecipeDTO } from "../lib/recipe.mapper";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";

export function getRecipeRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
  );

  /**
   * GET /v1/families/:familyId/recipes/:recipeId
   * Retrieve a specific recipe by ID
   */
  router.get(
    "/:recipeId",
    authenticate,
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

        if (!req.params.recipeId) {
          throw HttpError.badRequest("Missing recipeId parameter");
        }

        // Validate ObjectId format
        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid familyId format");
        }

        if (!ObjectId.isValid(req.params.recipeId)) {
          throw HttpError.badRequest("Invalid recipeId format");
        }

        const familyId = new ObjectId(req.params.familyId);
        const recipeId = new ObjectId(req.params.recipeId);

        const recipe = await recipeService.getRecipe(
          familyId,
          recipeId,
          userId,
        );

        res.status(200).json(toRecipeDTO(recipe));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
