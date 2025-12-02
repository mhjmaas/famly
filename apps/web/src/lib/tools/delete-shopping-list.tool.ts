import { z } from "zod";
import { deleteShoppingList } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const deleteShoppingListTool = {
  description:
    "Delete a shopping list and all its items. This action cannot be undone.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    listId: z.string().describe("The ID of the shopping list to delete"),
  }),
  execute: async ({
    familyId,
    listId,
  }: {
    familyId: string;
    listId: string;
  }) => {
    console.log("Delete Shopping List Tool called with", { familyId, listId });
    const cookieHeader = await getCookieHeader();

    try {
      await deleteShoppingList(familyId, listId, cookieHeader);

      const result = {
        success: true,
        deletedListId: listId,
        message: "Shopping list deleted successfully",
      };

      console.log("Delete Shopping List Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error deleting shopping list:", error);
      throw new Error(
        `Failed to delete shopping list: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
