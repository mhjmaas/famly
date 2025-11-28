import { z } from "zod";
import { getContributionGoal } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const checkContributionGoalTool = {
  description:
    "Check if a family member has a weekly contribution goal set. Returns the goal details if it exists, or indicates that no goal is set.",
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
      // Fetch the contribution goal for the member
      const goal = await getContributionGoal(familyId, memberId, {
        cookie: cookieHeader,
      });

      if (!goal) {
        const noResult = {
          hasGoal: false,
          message: "No contribution goal found for this family member",
        };

        console.log("Check Contribution Goal Tool result:", noResult);
        return noResult;
      }

      const result = {
        hasGoal: true,
        goal: {
          id: goal._id,
          familyId: goal.familyId,
          memberId: goal.memberId,
          weekStartDate: goal.weekStartDate,
          title: goal.title,
          description: goal.description,
          maxKarma: goal.maxKarma,
          recurring: goal.recurring,
          currentKarma: goal.currentKarma,
          deductions: goal.deductions,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
        },
      };

      console.log("Check Contribution Goal Tool result:", result);
      return result;
    } catch (error) {
      // If the API returns a 404, it means no goal exists
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        const result = {
          hasGoal: false,
          message: "No contribution goal found for this family member",
        };

        console.log("Check Contribution Goal Tool result:", result);
        return result;
      }

      console.error("Error checking contribution goal:", error);
      throw new Error(
        `Failed to check contribution goal for user ${memberId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
