import { z } from "zod";
import { createShoppingList } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createShoppingListTool = {
  description:
    "Create a new shopping list for a family. Can optionally include tags for categorization.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    name: z
      .string()
      .describe(
        "Name of the shopping list (e.g., 'Groceries', 'Hardware Store')",
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        "Optional tags for categorization (e.g., ['weekly', 'urgent'])",
      ),
  }),
  execute: async ({
    familyId,
    name,
    tags,
  }: {
    familyId: string;
    name: string;
    tags?: string[];
  }) => {
    console.log("Create Shopping List Tool called with", {
      familyId,
      name,
      tags,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const list = await createShoppingList(
        familyId,
        { name, tags: tags || [] },
        cookieHeader,
      );

      const result = {
        listId: list._id,
        name: list.name,
        tags: list.tags,
        itemCount: list.items.length,
        createdAt: list.createdAt,
      };

      console.log("Create Shopping List Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error creating shopping list:", error);
      throw new Error(
        `Failed to create shopping list: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
