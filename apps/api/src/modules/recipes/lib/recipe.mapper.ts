import type { Recipe, RecipeDTO } from "../domain/recipe";

export function toRecipeDTO(recipe: Recipe): RecipeDTO {
  const dto: RecipeDTO = {
    _id: recipe._id.toString(),
    familyId: recipe.familyId.toString(),
    name: recipe.name,
    description: recipe.description,
    steps: recipe.steps,
    tags: recipe.tags,
    createdBy: recipe.createdBy.toString(),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };

  if (typeof recipe.durationMinutes === "number") {
    dto.durationMinutes = recipe.durationMinutes;
  }

  if (recipe.imageUrl) {
    dto.imageUrl = recipe.imageUrl;
  }

  return dto;
}

export function toRecipeDTOArray(recipes: Recipe[]): RecipeDTO[] {
  return recipes.map(toRecipeDTO);
}
