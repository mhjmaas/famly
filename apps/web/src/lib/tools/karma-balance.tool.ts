import { z } from "zod";
import { getKarmaBalance } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const karmaBalanceTool = {
  description: "Retrieve the karma balance for a specific family member.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    memberId: z.string().describe("The ID of the family member (memberId)"),
  }),
  execute: async ({
    familyId,
    memberId,
  }: {
    familyId: string;
    memberId: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Fetch the karma balance for the specified user
      const karmaBalance = await getKarmaBalance(
        familyId,
        memberId,
        cookieHeader,
      );

      const result = {
        userId: karmaBalance.userId,
        familyId: karmaBalance.familyId,
        totalKarma: karmaBalance.totalKarma,
        lastUpdated: karmaBalance.lastUpdated,
      };

      console.log("Karma Balance Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error fetching karma balance:", error);
      throw new Error(
        `Failed to fetch karma balance for user ${memberId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
