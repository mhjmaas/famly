import { RecipeRepository } from "./repositories/recipe.repository";

/**
 * Initialize recipes module
 * Currently ensures indexes are created on application startup
 */
export async function initializeRecipesModule(): Promise<void> {
  const recipeRepository = new RecipeRepository();
  await recipeRepository.ensureIndexes();
}
