import { getDb } from "@infra/mongo/client";
import {
  isSupportedLanguage,
  type SupportedLanguage,
} from "@modules/auth/language";
import { ObjectId } from "mongodb";
import { logger } from "./logger";

/**
 * Get a user's display name from the database
 * Attempts to fetch the user's name, falls back to email, and finally the user ID
 *
 * @param userId - The user ID (string or ObjectId) to fetch the name for
 * @returns The user's name, email, or the ID if not found
 */
export async function getUserName(userId: string | ObjectId): Promise<string> {
  try {
    const db = getDb();
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;

    const user = await db
      .collection("user")
      .findOne({ _id: { $eq: objectId } });

    if (user) {
      return user.name || user.email || userId.toString();
    }

    return userId.toString();
  } catch (error) {
    logger.debug("Failed to fetch user name", { userId, error });
    return userId.toString();
  }
}

/**
 * Get multiple users' display names from the database
 * Efficiently fetches multiple users in a single database query
 *
 * @param userIds - Array of user IDs to fetch names for
 * @returns Map of user IDs to display names
 */
export async function getUserNames(
  userIds: (string | ObjectId)[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const nameMap = new Map<string, string>();

  try {
    const db = getDb();
    const objectIds = userIds.map((id) =>
      typeof id === "string" ? new ObjectId(id) : id,
    );

    const users = await db
      .collection("user")
      .find({ _id: { $in: objectIds } })
      .toArray();

    // Create a map with all original IDs first (for fallback)
    userIds.forEach((id) => {
      nameMap.set(id.toString(), id.toString());
    });

    // Override with actual user data if found
    users.forEach((user) => {
      const userId = user._id.toString();
      const displayName = user.name || user.email || userId;
      nameMap.set(userId, displayName);
    });

    return nameMap;
  } catch (error) {
    logger.debug("Failed to fetch user names", { userIds, error });

    // Return fallback map with IDs
    const fallbackMap = new Map<string, string>();
    userIds.forEach((id) => {
      fallbackMap.set(id.toString(), id.toString());
    });
    return fallbackMap;
  }
}

/**
 * Get a user's preferred language with fallback to default (en-US)
 */
export async function getUserLanguage(
  userId: string | ObjectId,
): Promise<SupportedLanguage> {
  try {
    const db = getDb();
    const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;

    const user = await db
      .collection("user")
      .findOne<{ language?: string }>({ _id: { $eq: objectId } });

    if (user?.language && isSupportedLanguage(user.language)) {
      return user.language;
    }
  } catch (error) {
    logger.debug("Failed to fetch user language", { userId, error });
  }

  return "en-US";
}

/**
 * Get languages for multiple users in one query
 * Returns a map of userId -> locale (defaults to en-US when missing/invalid)
 */
export async function getUserLanguages(
  userIds: (string | ObjectId)[],
): Promise<Map<string, SupportedLanguage>> {
  const languageMap = new Map<string, SupportedLanguage>();

  if (userIds.length === 0) {
    return languageMap;
  }

  // Seed with defaults for predictable results
  userIds.forEach((id) => {
    languageMap.set(id.toString(), "en-US");
  });

  try {
    const db = getDb();
    const objectIds = userIds.map((id) =>
      typeof id === "string" ? new ObjectId(id) : id,
    );

    const users = await db
      .collection("user")
      .find<{ _id: ObjectId; language?: string }>({
        _id: { $in: objectIds },
      })
      .toArray();

    users.forEach((user) => {
      if (user.language && isSupportedLanguage(user.language)) {
        languageMap.set(user._id.toString(), user.language);
      }
    });
  } catch (error) {
    logger.debug("Failed to fetch user languages", { userIds, error });
  }

  return languageMap;
}
