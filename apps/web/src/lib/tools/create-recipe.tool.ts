import { z } from "zod";
import { createRecipe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createRecipeTool = {
  description:
    "Create a new recipe for a family. Requires a name and description. Can optionally include duration, steps, and tags.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    name: z.string().describe("Name of the recipe"),
    description: z.string().describe("Description of the recipe"),
    durationMinutes: z
      .number()
      .optional()
      .describe("Estimated cooking time in minutes"),
    steps: z
      .array(z.string())
      .optional()
      .describe("List of cooking steps in order"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags for categorization (e.g., ['dinner', 'quick'])"),
  }),
  execute: async ({
    familyId,
    name,
    description,
    durationMinutes,
    steps,
    tags,
  }: {
    familyId: string;
    name: string;
    description: string;
    durationMinutes?: number;
    steps?: string[];
    tags?: string[];
  }) => {
    console.log("Create Recipe Tool called with", {
      familyId,
      name,
      description,
      durationMinutes,
      steps,
      tags,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const recipe = await createRecipe(
        familyId,
        {
          name,
          description,
          durationMinutes,
          steps: steps || [],
          tags: tags || [],
        },
        cookieHeader,
      );

      const result = {
        recipeId: recipe._id,
        name: recipe.name,
        description: recipe.description,
        durationMinutes: recipe.durationMinutes,
        stepCount: recipe.steps.length,
        tags: recipe.tags,
        createdAt: recipe.createdAt,
      };

      console.log("Create Recipe Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error creating recipe:", error);
      throw new Error(
        `Failed to create recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
};
