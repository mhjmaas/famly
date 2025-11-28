/**
 * Message Input Preferences
 * Manages user preferences for the message input component
 */

export interface MessageInputPreferences {
  /** Whether web search is enabled by default */
  webSearch?: boolean;
  // Future preferences can be added here:
  // model?: string;
  // temperature?: number;
  // etc.
}

const STORAGE_KEY = "messageInputPreferences";

/**
 * Load message input preferences from localStorage
 */
export function loadMessageInputPreferences(): MessageInputPreferences {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MessageInputPreferences;
    }
  } catch (error) {
    console.error("Failed to load message input preferences:", error);
  }

  return {};
}

/**
 * Save message input preferences to localStorage
 */
export function saveMessageInputPreferences(
  preferences: MessageInputPreferences,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save message input preferences:", error);
  }
}

/**
 * Update a specific preference
 */
export function updateMessageInputPreference<
  K extends keyof MessageInputPreferences,
>(key: K, value: MessageInputPreferences[K]): void {
  const current = loadMessageInputPreferences();
  const updated = { ...current, [key]: value };
  saveMessageInputPreferences(updated);
}

/**
 * Clear all message input preferences
 */
export function clearMessageInputPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear message input preferences:", error);
  }
}
