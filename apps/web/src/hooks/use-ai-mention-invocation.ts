import { useCallback, useState } from "react";
import { sendMessage } from "@/lib/api-client";
import { AI_SENDER_ID } from "@/lib/utils/ai-message-utils";
import type { MessageDTO } from "@/types/api.types";

interface AIInvocationOptions {
  /** The chat ID where the AI response should be posted */
  chatId: string;
  /** Callback when AI response is received and persisted */
  onResponse?: (message: MessageDTO) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface AIInvocationResult {
  /** Whether the AI is currently processing */
  isProcessing: boolean;
  /** The current streaming text (while AI is responding) */
  streamingText: string;
  /** Invoke the AI with a question */
  invokeAI: (question: string, context?: MessageDTO[]) => Promise<void>;
}

/**
 * Hook to invoke the AI assistant from a DM/Group chat via @mention.
 * This sends the question to the AI API and persists the response to the chat.
 */
export function useAIMentionInvocation({
  chatId,
  onResponse,
  onError,
}: AIInvocationOptions): AIInvocationResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const invokeAI = useCallback(
    async (question: string, context?: MessageDTO[]) => {
      if (!question.trim() || !chatId) {
        console.log("[AI Mention] Skipping - empty question or chatId");
        return;
      }

      setIsProcessing(true);
      setStreamingText(""); // Reset streaming text

      try {
        // Build the request body with context in UIMessage format
        // The API expects messages with id and parts fields
        const contextMessages = (context || [])
          .slice(-10)
          .map((msg, index) => ({
            id: `ctx-${index}-${msg._id}`,
            role: msg.senderId === AI_SENDER_ID ? "assistant" : "user",
            parts: [{ type: "text", text: msg.body }],
          }));

        // Add the current question
        const questionMessage = {
          id: `question-${Date.now()}`,
          role: "user" as const,
          parts: [{ type: "text" as const, text: question }],
        };

        const requestBody = {
          messages: [...contextMessages, questionMessage],
        };

        // Call the AI API endpoint
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.statusText}`);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let fullResponse = "";
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse the streaming response (AI SDK v6 data stream format)
          // Format: data: {"type":"text-delta","id":"txt-0","delta":"..."}
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              if (jsonStr === "[DONE]") continue;

              try {
                const data = JSON.parse(jsonStr);
                // Handle text-delta events
                if (data.type === "text-delta" && data.delta) {
                  fullResponse += data.delta;
                  setStreamingText(fullResponse); // Update streaming text in real-time
                }
              } catch {
                // Ignore parse errors for non-JSON lines
              }
            }
          }
        }

        // Persist the AI response to the chat
        if (fullResponse.trim()) {
          const clientId = `ai-mention-${Date.now()}-${Math.random()}`;
          const persistedMessage = await sendMessage(chatId, {
            body: fullResponse,
            clientId,
            senderId: AI_SENDER_ID,
          });

          onResponse?.(persistedMessage);
        }
      } catch (error) {
        console.error("AI mention invocation failed:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsProcessing(false);
        setStreamingText(""); // Clear streaming text when done
      }
    },
    [chatId, onResponse, onError],
  );

  return {
    isProcessing,
    streamingText,
    invokeAI,
  };
}
