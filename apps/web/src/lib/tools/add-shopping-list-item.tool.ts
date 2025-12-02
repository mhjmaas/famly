import { z } from "zod";
import { addShoppingListItem } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const addShoppingListItemTool = {
  description:
    "Add an item to an existing shopping list. The item will be unchecked by default.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    listId: z
      .string()
      .describe("The ID of the shopping list to add the item to"),
    name: z
      .string()
      .describe("Name of the item to add (e.g., 'Milk', 'Bread')"),
  }),
  execute: async ({
    familyId,
    listId,
    name,
  }: {
    familyId: string;
    listId: string;
    name: string;
  }) => {
    console.log("Add Shopping List Item Tool called with", {
      familyId,
      listId,
      name,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const list = await addShoppingListItem(
        familyId,
        listId,
        { name },
        cookieHeader,
      );

      // Find the newly added item (last item in the list)
      const newItem = list.items[list.items.length - 1];

      const result = {
        listId: list._id,
        listName: list.name,
        item: {
          itemId: newItem._id,
          name: newItem.name,
          checked: newItem.checked,
        },
        totalItems: list.items.length,
      };

      console.log("Add Shopping List Item Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error adding shopping list item:", error);
      throw new Error(
        `Failed to add shopping list item: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
