import { z } from "zod";
import { getRecipes } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listRecipesTool = {
  description:
    "List all recipes for a family. Returns recipes with their name, description, duration, steps, and tags.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    console.log("List Recipes Tool called with", { familyId });
    const cookieHeader = await getCookieHeader();

    try {
      const recipes = await getRecipes(familyId, cookieHeader);

      const result = recipes.map((recipe) => ({
        recipeId: recipe._id,
        name: recipe.name,
        description: recipe.description,
        durationMinutes: recipe.durationMinutes,
        stepCount: recipe.steps.length,
        tags: recipe.tags,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      }));

      console.log("List Recipes Tool with result", result);
      return {
        recipes: result,
        totalCount: result.length,
      };
    } catch (error) {
      console.error("Error listing recipes:", error);
      throw new Error(
        `Failed to list recipes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
};
