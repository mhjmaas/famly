import { z } from "zod";

export const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
