import { z } from "zod";

export const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
