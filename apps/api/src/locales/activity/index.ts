import { type ActivityDictionary, activityEnUS } from "./en-US";
import { activityNlNL } from "./nl-NL";

export const activityDictionaries = {
  "en-US": activityEnUS,
  "nl-NL": activityNlNL,
} as const;

export type ActivityLocale = keyof typeof activityDictionaries;
export type ActivityTemplates = ActivityDictionary["activity"];

export function getActivityDictionary(
  locale: ActivityLocale,
): typeof activityEnUS | typeof activityNlNL {
  return activityDictionaries[locale];
}
