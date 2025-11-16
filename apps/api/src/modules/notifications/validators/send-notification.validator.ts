import { z } from "zod";

export const sendNotificationSchema = z.object({
  userId: z.string(),
  notification: z.object({
    title: z.string(),
    body: z.string(),
    icon: z.string().optional(),
    image: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
