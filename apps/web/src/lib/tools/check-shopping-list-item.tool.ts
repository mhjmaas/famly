import { z } from "zod";
import { updateShoppingListItem } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const checkShoppingListItemTool = {
  description:
    "Check or uncheck an item in a shopping list. When all items are checked, the list is considered completed.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    listId: z.string().describe("The ID of the shopping list"),
    itemId: z.string().describe("The ID of the item to check/uncheck"),
    checked: z
      .boolean()
      .describe(
        "Whether the item should be checked (true) or unchecked (false)",
      ),
  }),
  execute: async ({
    familyId,
    listId,
    itemId,
    checked,
  }: {
    familyId: string;
    listId: string;
    itemId: string;
    checked: boolean;
  }) => {
    console.log("Check Shopping List Item Tool called with", {
      familyId,
      listId,
      itemId,
      checked,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const list = await updateShoppingListItem(
        familyId,
        listId,
        itemId,
        { checked },
        cookieHeader,
      );

      const checkedCount = list.items.filter((i) => i.checked).length;
      const totalCount = list.items.length;
      const isListCompleted = totalCount > 0 && checkedCount === totalCount;
      const updatedItem = list.items.find((i) => i._id === itemId);

      const result = {
        listId: list._id,
        listName: list.name,
        item: updatedItem
          ? {
              itemId: updatedItem._id,
              name: updatedItem.name,
              checked: updatedItem.checked,
            }
          : null,
        listProgress: {
          checkedCount,
          totalCount,
          isCompleted: isListCompleted,
        },
      };

      console.log("Check Shopping List Item Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error checking shopping list item:", error);
      throw new Error(
        `Failed to check shopping list item: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
