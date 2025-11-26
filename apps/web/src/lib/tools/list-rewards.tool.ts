import { z } from "zod";
import { getRewards } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listRewardsTool = {
  description:
    "List all available rewards for a family. Returns reward details including name, karma cost, description, and image URL.",
  inputSchema: z.object({
    familyId: z
      .string()
      .describe("The ID of the family to retrieve rewards for"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    // Fetch all rewards for the family
    const rewards = await getRewards(familyId, cookieHeader);

    // Format the response with reward details
    const result = rewards.map((reward) => ({
      rewardId: reward._id,
      name: reward.name,
      description: reward.description,
      karmaCost: reward.karmaCost,
      imageUrl: reward.imageUrl,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
    }));

    console.log("List Rewards Tool with result", result);
    return result;
  },
};
