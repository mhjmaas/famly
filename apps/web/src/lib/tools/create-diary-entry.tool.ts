import { z } from "zod";
import { createDiaryEntry } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const createDiaryEntryTool = {
  description:
    "Create a new personal diary entry. The entry is associated with a specific date.",
  inputSchema: z.object({
    date: z
      .string()
      .describe("The date for the diary entry (YYYY-MM-DD format)"),
    entry: z.string().describe("The diary entry content/text"),
  }),
  execute: async ({ date, entry }: { date: string; entry: string }) => {
    console.log("Create Diary Entry Tool called with", { date, entry });
    const cookieHeader = await getCookieHeader();

    try {
      const diaryEntry = await createDiaryEntry({ date, entry }, cookieHeader);

      const result = {
        entryId: diaryEntry._id,
        date: diaryEntry.date,
        entry: diaryEntry.entry,
        createdAt: diaryEntry.createdAt,
      };

      console.log("Create Diary Entry Tool with result", result);
      return result;
    } catch (error) {
      console.error("Error creating diary entry:", error);
      throw new Error(
        `Failed to create diary entry: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
