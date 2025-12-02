import type { SupportedLanguage } from "@modules/auth/language";
import { getEnv } from "../../../config/env";
import {
  type NotificationStringKey,
  resolveNotificationLocale,
  translateNotification,
} from "./notification-i18n";

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

function translate(
  locale: SupportedLanguage,
  key: NotificationStringKey,
  params: Record<string, string | number | undefined> = {},
): string {
  return translateNotification(locale, key, params);
}

/**
 * Create a notification for task completion
 */
export function createTaskCompletionNotification(
  localeInput: string | undefined,
  taskName: string,
  _completedBy: string,
  karmaEarned?: number,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const body = karmaEarned
    ? translate(locale, "task.completedWithKarmaDescription", {
        name: taskName,
        karma: karmaEarned,
      })
    : translate(locale, "task.completedDescription", { name: taskName });

  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "task.completed"),
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
  localeInput: string | undefined,
  amount: number,
  _grantedBy: string,
  reason?: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const body = reason
    ? translate(locale, "karma.awardedDescriptionWithReason", {
        amount,
        reason,
      })
    : translate(locale, "karma.awardedDescription", {
        amount,
        description: "",
      });

  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "karma.awarded"),
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
  localeInput: string | undefined,
  rewardName: string,
  claimedBy: string,
  karmaCost: number,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "reward.claimed"),
    body: translate(locale, "reward.claimedDescription", {
      rewardName,
      memberName: claimedBy,
      karmaCost,
    }),
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
  localeInput: string | undefined,
  karmaAmount: number,
  goalTitle: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "contributionGoal.awarded"),
    body: translate(locale, "contributionGoal.awardedDescription", {
      memberName: "",
      amount: karmaAmount,
      goalTitle,
    }),
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
  localeInput: string | undefined,
  goalTitle: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "contributionGoal.zeroKarma"),
    body: translate(locale, "contributionGoal.zeroKarmaDescription", {
      goalTitle,
    }),
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "contribution_goal_zero_karma",
      url: `${baseUrl}/app`,
    },
  };
}

/**
 * Create a notification for a contribution goal deduction with reason
 */
export function createContributionGoalDeductionNotification(
  localeInput: string | undefined,
  amount: number,
  reason: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "contributionGoal.deductedWithReasonTitle", {
      amount,
    }),
    body: translate(locale, "contributionGoal.deductedWithReasonDescription", {
      reason,
    }),
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "contribution_goal_deducted",
      url: `${baseUrl}/app`,
    },
  };
}

/**
 * Create a notification for new chat message
 */
export function createChatMessageNotification(
  localeInput: string | undefined,
  senderName: string,
  messagePreview: string,
  chatId: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "chat.message", { senderName }),
    body: translate(locale, "chat.messageDescription", { messagePreview }),
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "chat_message",
      url: `${baseUrl}/app/chat?chatId=${chatId}`,
      chatId,
    },
  };
}

/**
 * Create a notification for family member added
 */
export function createFamilyMemberAddedNotification(
  localeInput: string | undefined,
  memberName: string,
  addedBy: string,
): NotificationPayload {
  const locale = resolveNotificationLocale(localeInput);
  const baseUrl = getBaseUrl();
  const iconUrl = `${baseUrl}/web-app-manifest-192x192.png`;

  return {
    title: translate(locale, "family.memberAdded"),
    body: translate(locale, "family.memberAddedDescription", {
      memberName,
      addedBy,
    }),
    icon: iconUrl,
    badge: iconUrl,
    data: {
      type: "family_member_added",
      url: `${baseUrl}/app/family`,
    },
  };
}
