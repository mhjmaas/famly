import { notificationsEnUS } from "./en-US";
import { notificationsNlNL } from "./nl-NL";

export const notificationDictionaries = {
  "en-US": notificationsEnUS,
  "nl-NL": notificationsNlNL,
} as const;

export type NotificationLocale = keyof typeof notificationDictionaries;
export type NotificationTemplates = (typeof notificationsEnUS)["notifications"];

export type NotificationDictionary =
  (typeof notificationDictionaries)[NotificationLocale];

export function getNotificationDictionary(locale: NotificationLocale) {
  return notificationDictionaries[locale];
}
