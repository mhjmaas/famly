/**
 * Notification Templates
 * Provides standardized notification content for different event types
 */

import { getEnv } from "../../../config/env";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
}

/**
 * Get the base URL for constructing absolute URLs in notifications
 */
function getBaseUrl(): string {
  const env = getEnv();
  return env.CLIENT_URL;
}

/**
 * Create a notification for task completion
 */
export function createTaskCompletionNotification(
  taskName: string,
  completedBy: string,
  karmaEarned?: number,
): NotificationPayload {
  const body = karmaEarned
    ? `${completedBy} completed "${taskName}" and earned ${karmaEarned} karma!`
    : `${completedBy} completed "${taskName}"`;

  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "Task Completed! 🎉",
    body,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "task_completion",
      url: `${baseUrl}/app/tasks`,
    },
  };
}

/**
 * Create a notification for karma grant
 */
export function createKarmaGrantNotification(
  amount: number,
  grantedBy: string,
  reason?: string,
): NotificationPayload {
  const body = reason
    ? `${grantedBy} granted you ${amount} karma for: ${reason}`
    : `${grantedBy} granted you ${amount} karma`;

  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "Karma Received! ⭐",
    body,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "karma_grant",
      url: `${baseUrl}/app`,
    },
  };
}

/**
 * Create a notification for reward claim
 */
export function createRewardClaimNotification(
  rewardName: string,
  claimedBy: string,
  karmaCost: number,
): NotificationPayload {
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "Reward Claimed! 🎁",
    body: `${claimedBy} claimed "${rewardName}" for ${karmaCost} karma`,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "reward_claim",
      url: `${baseUrl}/app/rewards`,
    },
  };
}

/**
 * Create a notification for contribution goal karma awarded
 */
export function createContributionGoalAwardedNotification(
  karmaAmount: number,
  goalTitle: string,
): NotificationPayload {
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "Weekly Goal Completed! 🎯",
    body: `You earned ${karmaAmount} karma from "${goalTitle}"`,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "contribution_goal_awarded",
      url: `${baseUrl}/app`,
    },
  };
}

/**
 * Create a notification for contribution goal with zero karma
 */
export function createContributionGoalZeroKarmaNotification(
  goalTitle: string,
): NotificationPayload {
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "Weekly Goal Ended 📊",
    body: `Your contribution goal "${goalTitle}" ended with no karma - all potential karma was deducted`,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "contribution_goal_zero_karma",
      url: `${baseUrl}/app`,
    },
  };
}

/**
 * Create a notification for new chat message
 */
export function createChatMessageNotification(
  senderName: string,
  messagePreview: string,
  chatId: string,
): NotificationPayload {
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: `New message from ${senderName}`,
    body: messagePreview,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "chat_message",
      url: `${baseUrl}/app/chat?id=${chatId}`,
      chatId,
    },
  };
}

/**
 * Create a notification for family member added
 */
export function createFamilyMemberAddedNotification(
  memberName: string,
  addedBy: string,
): NotificationPayload {
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: "New Family Member! 👨‍👩‍👧‍👦",
    body: `${addedBy} added ${memberName} to the family`,
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "family_member_added",
      url: `${baseUrl}/app/family`,
    },
  };
}
