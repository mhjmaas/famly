import { z } from "zod";
import { getRewards } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listRewardsTool = {
  description:
    "List available rewards for a family. Returns reward details including name, karma cost, description, and image URL.",
  inputSchema: z.object({
    familyId: z
      .string()
      .describe("The ID of the family to retrieve rewards for"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    const MAX_RESULTS = 100;

    try {
      // Fetch all rewards for the family
      const rewards = await getRewards(familyId, cookieHeader);

      // Limit results to prevent AI context overload
      const limitedRewards = rewards.slice(0, MAX_RESULTS);

      // Format the response with reward details
      const result = limitedRewards.map((reward) => ({
        rewardId: reward._id,
        name: reward.name,
        description: reward.description,
        karmaCost: reward.karmaCost,
        imageUrl: reward.imageUrl,
        createdAt: reward.createdAt,
        updatedAt: reward.updatedAt,
      }));

      const response: {
        rewards: typeof result;
        totalReturned: number;
        totalAvailable: number;
        wasTruncated: boolean;
        note?: string;
      } = {
        rewards: result,
        totalReturned: limitedRewards.length,
        totalAvailable: rewards.length,
        wasTruncated: rewards.length > MAX_RESULTS,
      };

      if (response.wasTruncated) {
        response.note = `Showing ${MAX_RESULTS} of ${rewards.length} rewards.`;
      }

      console.log("List Rewards Tool with result", response);
      return response;
    } catch (error) {
      console.error("Error listing rewards:", error);
      throw new Error(
        `Failed to list rewards: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
