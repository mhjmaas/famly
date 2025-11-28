import { z } from "zod";
import { getClaims } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const getClaimsTool = {
  description:
    "Get reward claims for a family. Defaults to pending claims to check active reward approvals. Can filter by status to view completed or cancelled claims history.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    status: z
      .enum(["pending", "completed", "cancelled"])
      .default("pending")
      .describe(
        "Status filter (defaults to 'pending'): 'pending' for claims awaiting parent approval, 'completed' for fulfilled claims, 'cancelled' for cancelled claims",
      ),
  }),
  execute: async ({
    familyId,
    status = "pending",
  }: {
    familyId: string;
    status?: "pending" | "completed" | "cancelled";
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    const MAX_RESULTS = 10;

    try {
      // Get claims for the family with status filter
      const claims = await getClaims(familyId, status, cookieHeader);

      // Limit results to prevent AI context overload
      const limitedClaims = claims.slice(0, MAX_RESULTS);

      // Format the response with claim details
      const result = limitedClaims.map((claim) => ({
        claimId: claim._id,
        rewardId: claim.rewardId,
        memberId: claim.memberId,
        status: claim.status,
        karmaCost: claim.karmaCost,
        createdAt: claim.createdAt,
        completedAt: claim.completedAt,
        completedBy: claim.completedBy,
        cancelledAt: claim.cancelledAt,
        cancelledBy: claim.cancelledBy,
        rewardName: claim.reward?.name,
        memberName: claim.member?.name,
      }));

      // Add notice if results were truncated
      const response: {
        claims: typeof result;
        totalReturned: number;
        totalAvailable: number;
        wasTruncated: boolean;
        note?: string;
      } = {
        claims: result,
        totalReturned: limitedClaims.length,
        totalAvailable: claims.length,
        wasTruncated: claims.length > MAX_RESULTS,
      };

      if (response.wasTruncated) {
        response.note = `Showing ${MAX_RESULTS} of ${claims.length} ${status} claims. Use status filter to view specific subsets.`;
      }

      console.log("Get Claims Tool with result", response);
      return response;
    } catch (error) {
      console.error("Error getting claims:", error);
      throw new Error(
        `Failed to get claims: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
