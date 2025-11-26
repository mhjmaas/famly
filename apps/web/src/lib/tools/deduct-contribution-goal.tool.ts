import { z } from "zod";
import { addDeduction } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const deductContributionGoalTool = {
  description:
    "Deduct points from a family member's weekly contribution goal. This reduces the current karma available for that member.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    memberId: z.string().describe("The ID of the family member (memberId)"),
    amount: z
      .number()
      .min(1)
      .max(50)
      .describe("The amount of karma to deduct (must be between 1 and 50)"),
    reason: z.string().max(500).describe("Reason for the deduction"),
  }),
  execute: async ({
    familyId,
    memberId,
    amount,
    reason,
  }: {
    familyId: string;
    memberId: string;
    amount: number;
    reason: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Add deduction to the contribution goal
      const goal = await addDeduction(
        familyId,
        memberId,
        {
          amount,
          reason,
        },
        { cookie: cookieHeader },
      );

      const result = {
        success: true,
        deductedAmount: amount,
        reason: reason,
        newCurrentKarma: goal.currentKarma,
        goalId: goal._id,
        memberId: goal.memberId,
      };

      console.log("Deduct Contribution Goal Tool result:", result);
      return result;
    } catch (error) {
      console.error("Error deducting contribution goal:", error);
      throw new Error(
        `Failed to deduct karma from contribution goal for user ${memberId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
