import { Router } from "express";
import { createRecipeRoute } from "./create-recipe.route";
import { deleteRecipeRoute } from "./delete-recipe.route";
import { getRecipeRoute } from "./get-recipe.route";
import { listRecipesRoute } from "./list-recipes.route";
import { searchRecipesRoute } from "./search-recipes.route";
import { updateRecipeRoute } from "./update-recipe.route";
import { uploadRecipeImageRoute } from "./upload-image.route";

/**
 * Create and aggregate all recipe routes
 * Mounts:
 *   POST   /
 *   GET    /
 *   GET    /:recipeId
 *   PATCH  /:recipeId
 *   DELETE /:recipeId
 *   POST   /search
 *   POST   /upload-image
 */
export function createRecipesRouter(): Router {
  const router = Router({ mergeParams: true });

  // Mount individual route handlers
  router.use(searchRecipesRoute()); // Must come before GET /:recipeId to avoid route confusion
  router.use(uploadRecipeImageRoute()); // Must come before GET /:recipeId to avoid route confusion
  router.use(createRecipeRoute());
  router.use(listRecipesRoute());
  router.use(getRecipeRoute());
  router.use(updateRecipeRoute());
  router.use(deleteRecipeRoute());

  return router;
}
