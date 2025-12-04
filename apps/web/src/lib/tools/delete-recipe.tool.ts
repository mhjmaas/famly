import { z } from "zod";
import { deleteRecipe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const deleteRecipeTool = {
  description: "Delete a recipe from a family.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    recipeId: z.string().describe("The ID of the recipe to delete"),
  }),
  execute: async ({
    familyId,
    recipeId,
  }: {
    familyId: string;
    recipeId: string;
  }) => {
    console.log("Delete Recipe Tool called with", { familyId, recipeId });
    const cookieHeader = await getCookieHeader();

    try {
      await deleteRecipe(familyId, recipeId, cookieHeader);

      console.log("Delete Recipe Tool completed successfully");
      return {
        success: true,
        deletedRecipeId: recipeId,
      };
    } catch (error) {
      console.error("Error deleting recipe:", error);
      throw new Error(
        `Failed to delete recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
};
