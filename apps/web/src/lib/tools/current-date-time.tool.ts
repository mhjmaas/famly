import { z } from "zod";

export const currentDateTimeTool = {
  description: "Retrieve the current date and time.",
  inputSchema: z.object({
    // No input required for this tool
  }),
  execute: async () => {
    // Get current date and time
    const now = new Date();

    // Return current date and time with timezone information

    const result = {
      localDateTime: now.toLocaleString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    console.log("Current Date and Time Tool with result", result);
    return result;
  },
};
