import { z } from "zod";
import { getRecipe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const getRecipeTool = {
  description:
    "Get the details of a specific recipe by ID. Returns the full recipe including all steps.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    recipeId: z.string().describe("The ID of the recipe to retrieve"),
  }),
  execute: async ({
    familyId,
    recipeId,
  }: {
    familyId: string;
    recipeId: string;
  }) => {
    console.log("Get Recipe Tool called with", { familyId, recipeId });
    const cookieHeader = await getCookieHeader();

    try {
      const recipe = await getRecipe(familyId, recipeId, cookieHeader);

      const result = {
        recipeId: recipe._id,
        name: recipe.name,
        description: recipe.description,
        durationMinutes: recipe.durationMinutes,
        steps: recipe.steps,
        tags: recipe.tags,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      };

      console.log("Get Recipe Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error getting recipe:", error);
      throw new Error(
        `Failed to get recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
};
