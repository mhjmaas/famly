import { useMemo } from "react";

export interface MentionMatch {
  /** The full matched text including @ symbol */
  fullMatch: string;
  /** The name that was mentioned (without @) */
  name: string;
  /** Start index of the mention in the text */
  startIndex: number;
  /** End index of the mention in the text */
  endIndex: number;
}

export interface MentionDetectionResult {
  /** Whether an AI mention was detected */
  hasAIMention: boolean;
  /** The detected mention, if any */
  mention: MentionMatch | null;
  /** The message text with the mention removed */
  messageWithoutMention: string;
  /** The question/content after the mention */
  question: string;
}

/**
 * Hook to detect @mentions of the AI assistant in message text.
 *
 * @param text - The message text to analyze
 * @param aiName - The configured AI name (e.g., "Jarvis")
 * @param enabled - Whether mention detection is enabled (e.g., aiIntegration is on)
 * @returns Detection result with mention info and extracted question
 */
export function useMentionDetection(
  text: string,
  aiName: string | undefined,
  enabled: boolean = true,
): MentionDetectionResult {
  return useMemo(() => {
    if (!enabled || !aiName || !text.trim()) {
      return {
        hasAIMention: false,
        mention: null,
        messageWithoutMention: text,
        question: "",
      };
    }

    // Create regex pattern for @aiName with word boundary
    // Escape special regex characters in the AI name
    const escapedName = aiName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mentionPattern = new RegExp(`@(${escapedName})\\b`, "i");

    const match = text.match(mentionPattern);

    if (!match || match.index === undefined) {
      return {
        hasAIMention: false,
        mention: null,
        messageWithoutMention: text,
        question: "",
      };
    }

    const fullMatch = match[0];
    const name = match[1];
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;

    // Extract the question (everything after the mention, trimmed)
    const beforeMention = text.slice(0, startIndex).trim();
    const afterMention = text.slice(endIndex).trim();

    // The question is primarily what comes after the mention
    // But if there's text before, include it too
    const question = afterMention || beforeMention;
    const messageWithoutMention = text
      .slice(0, startIndex)
      .concat(text.slice(endIndex))
      .trim();

    return {
      hasAIMention: true,
      mention: {
        fullMatch,
        name,
        startIndex,
        endIndex,
      },
      messageWithoutMention,
      question,
    };
  }, [text, aiName, enabled]);
}

/**
 * Standalone function to detect AI mention (for use outside React components)
 */
export function detectAIMention(
  text: string,
  aiName: string,
): MentionDetectionResult {
  if (!aiName || !text.trim()) {
    return {
      hasAIMention: false,
      mention: null,
      messageWithoutMention: text,
      question: "",
    };
  }

  const escapedName = aiName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mentionPattern = new RegExp(`@(${escapedName})\\b`, "i");

  const match = text.match(mentionPattern);

  if (!match || match.index === undefined) {
    return {
      hasAIMention: false,
      mention: null,
      messageWithoutMention: text,
      question: "",
    };
  }

  const fullMatch = match[0];
  const name = match[1];
  const startIndex = match.index;
  const endIndex = startIndex + fullMatch.length;

  const afterMention = text.slice(endIndex).trim();
  const beforeMention = text.slice(0, startIndex).trim();
  const question = afterMention || beforeMention;
  const messageWithoutMention = text
    .slice(0, startIndex)
    .concat(text.slice(endIndex))
    .trim();

  return {
    hasAIMention: true,
    mention: {
      fullMatch,
      name,
      startIndex,
      endIndex,
    },
    messageWithoutMention,
    question,
  };
}
