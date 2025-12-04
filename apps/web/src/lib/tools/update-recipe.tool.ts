import { z } from "zod";
import { updateRecipe } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const updateRecipeTool = {
  description:
    "Update an existing recipe. Only the fields provided will be updated.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    recipeId: z.string().describe("The ID of the recipe to update"),
    name: z.string().optional().describe("New name for the recipe"),
    description: z
      .string()
      .optional()
      .describe("New description for the recipe"),
    durationMinutes: z
      .number()
      .optional()
      .describe("New estimated cooking time in minutes"),
    steps: z
      .array(z.string())
      .optional()
      .describe("New list of cooking steps (replaces existing steps)"),
    tags: z
      .array(z.string())
      .optional()
      .describe("New tags for the recipe (replaces existing tags)"),
  }),
  execute: async ({
    familyId,
    recipeId,
    name,
    description,
    durationMinutes,
    steps,
    tags,
  }: {
    familyId: string;
    recipeId: string;
    name?: string;
    description?: string;
    durationMinutes?: number;
    steps?: string[];
    tags?: string[];
  }) => {
    console.log("Update Recipe Tool called with", {
      familyId,
      recipeId,
      name,
      description,
      durationMinutes,
      steps,
      tags,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const updateData: {
        name?: string;
        description?: string;
        durationMinutes?: number;
        steps?: string[];
        tags?: string[];
      } = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (durationMinutes !== undefined)
        updateData.durationMinutes = durationMinutes;
      if (steps !== undefined) updateData.steps = steps;
      if (tags !== undefined) updateData.tags = tags;

      const recipe = await updateRecipe(
        familyId,
        recipeId,
        updateData,
        cookieHeader,
      );

      const result = {
        recipeId: recipe._id,
        name: recipe.name,
        description: recipe.description,
        durationMinutes: recipe.durationMinutes,
        stepCount: recipe.steps.length,
        tags: recipe.tags,
        updatedAt: recipe.updatedAt,
      };

      console.log("Update Recipe Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw new Error(
        `Failed to update recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  },
};
