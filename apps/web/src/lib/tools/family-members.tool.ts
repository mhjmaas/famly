import { z } from "zod";
import { getFamilies } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const familyMembersTool = {
  description: "Retrieve information about a specific family and its members.",
  inputSchema: z.object({
    familyId: z.string().describe("The ID of the family to retrieve"),
  }),
  execute: async ({ familyId }: { familyId: string }) => {
    // Get cookie header for authentication
    const cookieHeader = await getCookieHeader();

    try {
      // Fetch all families with their members
      const families = await getFamilies(cookieHeader);

      // Find the specific family
      const family = families.find((f) => f.familyId === familyId);

      if (!family) {
        throw new Error(`Family with ID ${familyId} not found`);
      }

      const result = {
        familyId: family.familyId,
        familyName: family.name,
        members: family.members.map((member) => ({
          memberId: member.memberId,
          name: member.name,
          role: member.role,
          birthdate: member.birthdate,
        })),
      };

      console.log("Family Members Tool with result", result);
      // Format the response with family name and members
      return result;
    } catch (error) {
      console.error("Error fetching family members:", error);
      throw new Error(
        `Failed to fetch family members: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
