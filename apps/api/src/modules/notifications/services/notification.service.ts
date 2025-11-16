import webpush from "web-push";
import { getEnv } from "../../../config/env";
import { logger } from "../../../lib/logger";
import type { CreatePushSubscriptionInput } from "../domain/push-subscription";
import { PushSubscriptionRepository } from "../repositories/push-subscription.repository";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  private repository: PushSubscriptionRepository;
  private vapidConfigured: boolean;

  constructor() {
    this.repository = new PushSubscriptionRepository();
    this.vapidConfigured = false;
    this.initializeVapid();
  }

  private initializeVapid(): void {
    const env = getEnv();

    if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      logger.warn(
        "VAPID keys not configured. Push notifications will not be available.",
      );
      return;
    }

    try {
      webpush.setVapidDetails(
        `mailto:${env.VAPID_EMAIL}`,
        env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
      );
      this.vapidConfigured = true;
      logger.info("VAPID keys configured successfully");
    } catch (error) {
      logger.error("Failed to configure VAPID keys", { error });
    }
  }

  isVapidConfigured(): boolean {
    return this.vapidConfigured;
  }

  async subscribe(
    userId: string,
    endpoint: string,
    keys: { p256dh: string; auth: string },
    deviceInfo: { userAgent?: string; platform?: string },
  ): Promise<void> {
    if (!this.vapidConfigured) {
      throw new Error("Push notifications not configured");
    }

    const input: CreatePushSubscriptionInput = {
      userId,
      endpoint,
      keys,
      deviceInfo: {
        userAgent: deviceInfo.userAgent || "Unknown",
        platform: deviceInfo.platform || "Unknown",
      },
    };

    await this.repository.upsertByEndpoint(input);
    logger.info("User subscribed to push notifications", {
      userId,
      endpoint: endpoint.substring(0, 50),
    });
  }

  async unsubscribe(endpoint: string): Promise<boolean> {
    const deleted = await this.repository.deleteByEndpoint(endpoint);

    if (deleted) {
      logger.info("User unsubscribed from push notifications", {
        endpoint: endpoint.substring(0, 50),
      });
    }

    return deleted;
  }

  async sendNotification(
    userId: string,
    payload: NotificationPayload,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.vapidConfigured) {
      throw new Error("Push notifications not configured");
    }

    const subscriptions = await this.repository.findByUserId(userId);

    if (subscriptions.length === 0) {
      logger.debug("No subscriptions found for user", { userId });
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const notificationData = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            notificationData,
          );
          sent++;
          logger.debug("Notification sent successfully", {
            userId,
            endpoint: subscription.endpoint.substring(0, 50),
          });
        } catch (error: unknown) {
          failed++;

          // Handle invalid subscriptions (410 Gone)
          if (
            error &&
            typeof error === "object" &&
            "statusCode" in error &&
            error.statusCode === 410
          ) {
            logger.info("Removing invalid subscription", {
              userId,
              subscriptionId: subscription.id,
            });
            await this.repository.deleteById(subscription.id);
          } else {
            logger.error("Failed to send notification", {
              userId,
              endpoint: subscription.endpoint.substring(0, 50),
              error,
            });
          }
        }
      }),
    );

    logger.info("Notification batch completed", { userId, sent, failed });
    return { sent, failed };
  }

  async getSubscriptionStatus(userId: string): Promise<boolean> {
    const subscriptions = await this.repository.findByUserId(userId);
    return subscriptions.length > 0;
  }

  async ensureIndexes(): Promise<void> {
    await this.repository.ensureIndexes();
  }
}
