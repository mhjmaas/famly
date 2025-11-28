import { z } from "zod";
import { claimReward } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const claimRewardTool = {
  description:
    "Claim a reward. After a reward is claimed, a parent needs to verify and provide the reward to complete the claim.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    rewardId: z.string().describe("The ID of the reward to claim"),
  }),
  execute: async ({
    familyId,
    rewardId,
  }: {
    familyId: string;
    rewardId: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Claim the reward
      const claim = await claimReward(familyId, rewardId, cookieHeader);

      const result = {
        claimId: claim._id,
        rewardId: claim.rewardId,
        memberId: claim.memberId,
        status: claim.status,
        karmaCost: claim.karmaCost,
        createdAt: claim.createdAt,
        nextStep:
          "A parent needs to verify and provide this reward to complete the claim. Karma is only deducted upon completion.",
      };

      console.log("Claim Reward Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw new Error(
        `Failed to claim reward: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
