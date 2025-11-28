import { z } from "zod";
import { cancelClaim } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const cancelClaimTool = {
  description: "Cancel a pending reward claim. This will remove the claim.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family"),
    claimId: z.string().describe("The ID of the claim to cancel"),
  }),
  execute: async ({
    familyId,
    claimId,
  }: {
    familyId: string;
    claimId: string;
  }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Cancel the claim
      const claim = await cancelClaim(familyId, claimId, cookieHeader);

      const result = {
        claimId: claim._id,
        rewardId: claim.rewardId,
        memberId: claim.memberId,
        status: claim.status,
        karmaCost: claim.karmaCost,
        cancelledAt: claim.cancelledAt,
        cancelledBy: claim.cancelledBy,
        message:
          "Claim has been cancelled and karma has been returned to the member.",
      };

      console.log("Cancel Claim Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error cancelling claim:", error);
      throw new Error(
        `Failed to cancel claim: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
