import { z } from "zod";
import { grantKarma } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const modifyKarmaTool = {
  description:
    "Modify karma points for a family member. Can add or remove karma points (positive or negative values).",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    memberId: z.string().describe("The ID of the family member (memberId)"),
    amount: z
      .number()
      .min(-20)
      .max(20)
      .describe(
        "The amount of karma to add or remove (negative values remove karma, positive values add karma)",
      ),
    description: z
      .string()
      .max(500)
      .describe("Optional description explaining why the karma was modified"),
  }),
  execute: async ({
    familyId,
    memberId,
    amount,
    description,
  }: {
    familyId: string;
    memberId: string;
    amount: number;
    description?: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Grant or remove karma using the existing API endpoint
      const result = await grantKarma(
        familyId,
        {
          userId: memberId,
          amount,
          description,
        },
        cookieHeader,
      );

      console.log("Modify Karma Tool with result", result);
      return {
        eventId: result.eventId,
        familyId: result.familyId,
        userId: result.userId,
        amount: result.amount,
        totalKarma: result.totalKarma,
        description: result.description,
        grantedBy: result.grantedBy,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error("Error modifying karma:", error);
      throw new Error(
        `Failed to modify karma for user ${memberId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
