import { z } from "zod";
import { addShoppingListItem } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const addMultipleShoppingListItemsTool = {
  description:
    "Add multiple items to an existing shopping list at once. This is a convenience method for adding several items in a single operation.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    listId: z.string().describe("The ID of the shopping list to add items to"),
    items: z
      .array(z.string())
      .min(1)
      .max(20)
      .describe(
        "Array of item names to add (e.g., ['Milk', 'Bread', 'Eggs']). Maximum 20 items.",
      ),
  }),
  execute: async ({
    familyId,
    listId,
    items,
  }: {
    familyId: string;
    listId: string;
    items: string[];
  }) => {
    console.log("Add Multiple Shopping List Items Tool called with", {
      familyId,
      listId,
      items,
    });
    const cookieHeader = await getCookieHeader();

    try {
      const addedItems = [];
      const errors = [];
      let updatedList = null;

      // Add each item sequentially
      for (let i = 0; i < items.length; i++) {
        const itemName = items[i];
        try {
          updatedList = await addShoppingListItem(
            familyId,
            listId,
            { name: itemName },
            cookieHeader,
          );

          // Find the newly added item (last item in the list)
          const newItem = updatedList.items[updatedList.items.length - 1];
          addedItems.push({
            itemId: newItem._id,
            name: newItem.name,
            checked: newItem.checked,
          });
        } catch (error) {
          errors.push({
            index: i,
            itemName,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const result = {
        listId,
        listName: updatedList?.name,
        addedItems,
        totalAdded: addedItems.length,
        totalRequested: items.length,
        totalItemsInList: updatedList?.items.length ?? 0,
        errors: errors.length > 0 ? errors : undefined,
      };

      console.log("Add Multiple Shopping List Items Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error adding multiple shopping list items:", error);
      throw new Error(
        `Failed to add shopping list items: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
