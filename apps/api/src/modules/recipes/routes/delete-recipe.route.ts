import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { RecipeRepository } from "../repositories/recipe.repository";
import { RecipeService } from "../services/recipe.service";

export function deleteRecipeRoute(): Router {
  const router = Router({ mergeParams: true });
  const recipeRepository = new RecipeRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const recipeService = new RecipeService(
    recipeRepository,
    membershipRepository,
  );

  /**
   * DELETE /v1/families/:familyId/recipes/:recipeId
   * Delete a recipe
   */
  router.delete(
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

        const familyId = new ObjectId(req.params.familyId);
        const recipeId = new ObjectId(req.params.recipeId);

        await recipeService.deleteRecipe(familyId, recipeId, userId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
