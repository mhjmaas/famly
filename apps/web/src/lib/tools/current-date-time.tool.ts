import { z } from "zod";

export const currentDateTimeTool = {
  description: "Retrieve the current date and time.",
  inputSchema: z.object({
    // No input required for this tool
  }),
  execute: async () => {
    const now = new Date(); // always stored as UTC internally

    const time = new Intl.DateTimeFormat("nl-NL", {
      timeZone: process.env.TIMEZONE || "Europe/Amsterdam",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(now);

    const date = new Intl.DateTimeFormat("nl-NL", {
      timeZone: "Europe/Amsterdam",
      dateStyle: "full",
    }).format(now);

    const result = {
      localDate: date,
      localDateTime: time,
      timeZone: process.env.TIMEZONE || "Europe/Amsterdam",
    };

    console.log("Current Date and Time Tool with result", result);
    return result;
  },
};
