import { z } from "zod";
import { getShoppingLists } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listShoppingListsTool = {
  description:
    "List all shopping lists for a family. Returns active and completed shopping lists with their items.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    console.log("List Shopping Lists Tool called with", { familyId });
    const cookieHeader = await getCookieHeader();

    try {
      const lists = await getShoppingLists(familyId, cookieHeader);

      const result = lists.map((list) => {
        const checkedCount = list.items.filter((i) => i.checked).length;
        const totalCount = list.items.length;
        const isCompleted = totalCount > 0 && checkedCount === totalCount;

        return {
          listId: list._id,
          name: list.name,
          tags: list.tags,
          itemCount: totalCount,
          checkedCount,
          isCompleted,
          items: list.items.map((item) => ({
            itemId: item._id,
            name: item.name,
            checked: item.checked,
          })),
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        };
      });

      console.log("List Shopping Lists Tool with result", result);
      return {
        shoppingLists: result,
        totalCount: result.length,
        activeCount: result.filter((l) => !l.isCompleted).length,
        completedCount: result.filter((l) => l.isCompleted).length,
      };
    } catch (error) {
      console.error("Error listing shopping lists:", error);
      throw new Error(
        `Failed to list shopping lists: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
