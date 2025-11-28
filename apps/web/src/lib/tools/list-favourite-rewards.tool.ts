import { z } from "zod";
import { getRewards } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listFavouriteRewardsTool = {
  description:
    "List all rewards that a user has marked as favourite within a family. Returns reward details including name, karma cost, description, and image URL.",
  inputSchema: z.object({
    familyId: z
      .string()
      .describe("The ID of the family to retrieve favourite rewards for"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Fetch all rewards for the family
      const rewards = await getRewards(familyId, cookieHeader);

      // Filter only favourite rewards
      const favouriteRewards = rewards.filter(
        (reward) => reward.isFavourite === true,
      );

      // Format the response with favourite reward details
      const result = favouriteRewards.map((reward) => ({
        rewardId: reward._id,
        name: reward.name,
        description: reward.description,
        karmaCost: reward.karmaCost,
        imageUrl: reward.imageUrl,
        createdAt: reward.createdAt,
        updatedAt: reward.updatedAt,
      }));

      console.log("List Favourite Rewards Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error listing favourite rewards:", error);
      throw new Error(
        `Failed to list favourite rewards: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
