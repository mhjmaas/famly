import { z } from "zod";
import { getDiaryEntries } from "@/lib/api-client";
import { getCookieHeader } from "@/lib/server-cookies";

export const listDiaryEntriesTool = {
  description:
    "List personal diary entries. Can filter by date range. Returns entries sorted by date (newest first).",
  inputSchema: z.object({
    startDate: z
      .string()
      .optional()
      .describe("Optional start date filter (YYYY-MM-DD format)"),
    endDate: z
      .string()
      .optional()
      .describe("Optional end date filter (YYYY-MM-DD format)"),
  }),
  execute: async ({
    startDate,
    endDate,
  }: {
    startDate?: string;
    endDate?: string;
  }) => {
    console.log("List Diary Entries Tool called with", { startDate, endDate });
    const cookieHeader = await getCookieHeader();

    const MAX_RESULTS = 50;

    try {
      const entries = await getDiaryEntries(startDate, endDate, cookieHeader);

      // Limit results to prevent AI context overload
      const limitedEntries = entries.slice(0, MAX_RESULTS);

      const result = limitedEntries.map((entry) => ({
        entryId: entry._id,
        date: entry.date,
        entry: entry.entry,
        createdAt: entry.createdAt,
      }));

      const response: {
        entries: typeof result;
        totalReturned: number;
        totalAvailable: number;
        wasTruncated: boolean;
        note?: string;
      } = {
        entries: result,
        totalReturned: limitedEntries.length,
        totalAvailable: entries.length,
        wasTruncated: entries.length > MAX_RESULTS,
      };

      if (response.wasTruncated) {
        response.note = `Showing ${MAX_RESULTS} of ${entries.length} entries. Use date filters to narrow results.`;
      }

      console.log("List Diary Entries Tool with result", response);
      return response;
    } catch (error) {
      console.error("Error listing diary entries:", error);
      throw new Error(
        `Failed to list diary entries: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
