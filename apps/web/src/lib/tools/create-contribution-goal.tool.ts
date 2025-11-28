import { z } from "zod";
import { createContributionGoal } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createContributionGoalTool = {
  description:
    "Create a new weekly contribution goal for a family member. This establishes a target karma amount that can be deducted from.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    memberId: z.string().describe("The ID of the family member (memberId)"),
    title: z.string().max(200).describe("Title of the contribution goal"),
    description: z
      .string()
      .max(2000)
      .describe("Description of the contribution goal"),
    maxKarma: z
      .number()
      .min(1)
      .max(200)
      .describe("Maximum karma allowed for this goal (between 1 and 200)"),
    recurring: z
      .boolean()
      .optional()
      .describe(
        "Whether the goal should recur automatically each week (default is true)",
      ),
  }),
  execute: async ({
    familyId,
    memberId,
    title,
    description,
    maxKarma,
    recurring,
  }: {
    familyId: string;
    memberId: string;
    title: string;
    description: string;
    maxKarma: number;
    recurring?: boolean;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Create the contribution goal
      const goal = await createContributionGoal(
        familyId,
        {
          memberId,
          title,
          description,
          maxKarma,
          recurring,
        },
        { cookie: cookieHeader },
      );

      const result = {
        success: true,
        goalId: goal._id,
        familyId: goal.familyId,
        memberId: goal.memberId,
        title: goal.title,
        description: goal.description,
        maxKarma: goal.maxKarma,
        recurring: goal.recurring,
        currentKarma: goal.currentKarma,
        weekStartDate: goal.weekStartDate,
      };

      console.log("Create Contribution Goal Tool result:", result);
      return result;
    } catch (error) {
      console.error("Error creating contribution goal:", error);
      throw new Error(
        `Failed to create contribution goal for user ${memberId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
