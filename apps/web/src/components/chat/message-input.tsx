"use client";

import type { FileUIPart } from "ai";
import { CheckIcon, GlobeIcon, MicIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { detectAIMention } from "@/hooks/use-mention-detection";
import {
  loadMessageInputPreferences,
  updateMessageInputPreference,
} from "@/lib/utils/message-input-preferences";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectChatLoading, sendMessage } from "@/store/slices/chat.slice";

// Model configuration - can be extended or fetched from API
const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai", "azure"],
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    chef: "Google",
    chefSlug: "google",
    providers: ["google"],
  },
];

export interface MessageSubmitData {
  text: string;
  model?: string;
  webSearch?: boolean;
  files?: FileUIPart[];
}

export interface AIMentionData {
  /** The original message with the mention */
  originalMessage: string;
  /** The question extracted from the message */
  question: string;
  /** The message to persist (without the mention) */
  messageWithoutMention: string;
}

interface MessageInputProps {
  /** Chat ID for Redux-based message sending (optional if using onSendMessage) */
  chatId?: string;
  dict: {
    messageInput: {
      placeholder: string;
      shiftEnterHint: string;
      characterCount: string;
    };
    errors: {
      messageTooLong?: string;
      sendMessage: string;
    };
  };
  /** Override placeholder text (e.g., for AI chat) */
  placeholderOverride?: string;
  /** Enable file attachments feature */
  enableAttachments?: boolean;
  /** Enable web search toggle */
  enableWebSearch?: boolean;
  /** Enable microphone/voice input */
  enableMicrophone?: boolean;
  /** Enable AI model selector */
  enableModelSelector?: boolean;
  /** Callback when web search is toggled */
  onWebSearchToggle?: (enabled: boolean) => void;
  /** Callback when microphone is toggled */
  onMicrophoneToggle?: (enabled: boolean) => void;
  /** Callback when model is changed */
  onModelChange?: (modelId: string) => void;
  /** Default model ID */
  defaultModel?: string;
  /** Custom submit handler - bypasses Redux dispatch when provided */
  onSendMessage?: (data: MessageSubmitData) => void | Promise<void>;
  /** External loading state (for AI streaming) */
  isLoading?: boolean;
  /** Controlled input value */
  value?: string;
  /** Callback when input value changes */
  onValueChange?: (value: string) => void;
  /** AI name for @mention detection (e.g., "Jarvis") */
  aiName?: string;
  /** Callback when AI is mentioned in a DM/Group chat */
  onAIMention?: (data: AIMentionData) => void | Promise<void>;
  /** Whether AI mention detection is enabled */
  enableAIMention?: boolean;
}

export function MessageInput({
  chatId,
  dict,
  placeholderOverride,
  enableAttachments = false,
  enableWebSearch = false,
  enableMicrophone = false,
  enableModelSelector = false,
  onWebSearchToggle,
  onMicrophoneToggle,
  onModelChange,
  defaultModel = models[0].id,
  onSendMessage,
  isLoading: externalLoading,
  value: controlledValue,
  onValueChange,
  aiName,
  onAIMention,
  enableAIMention = false,
}: MessageInputProps) {
  const dispatch = useAppDispatch();
  const reduxLoading = useAppSelector(selectChatLoading);
  const [internalText, setInternalText] = useState("");

  // Support both controlled and uncontrolled modes
  const text = controlledValue ?? internalText;
  const setText = (value: string) => {
    if (onValueChange) {
      onValueChange(value);
    } else {
      setInternalText(value);
    }
  };

  // Load preferences from localStorage on mount
  const [useWebSearch, setUseWebSearch] = useState(() => {
    if (enableWebSearch) {
      const preferences = loadMessageInputPreferences();
      return preferences.webSearch ?? false;
    }
    return false;
  });
  const [useMicrophone, setUseMicrophone] = useState(false);
  const [model, setModel] = useState(defaultModel);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");

  const selectedModelData = models.find((m) => m.id === model);

  const handleWebSearchToggle = () => {
    const newValue = !useWebSearch;
    setUseWebSearch(newValue);
    // Save to localStorage
    updateMessageInputPreference("webSearch", newValue);
    onWebSearchToggle?.(newValue);
  };

  const handleMicrophoneToggle = () => {
    const newValue = !useMicrophone;
    setUseMicrophone(newValue);
    onMicrophoneToggle?.(newValue);
  };

  const handleModelSelect = (modelId: string) => {
    setModel(modelId);
    setModelSelectorOpen(false);
    onModelChange?.(modelId);
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (message.text && message.text.length > 8000) {
      toast.error(dict.errors.messageTooLong || "Message is too long");
      return;
    }

    setStatus("submitted");

    try {
      // Use custom handler if provided (AI mode), otherwise use Redux
      if (onSendMessage) {
        await onSendMessage({
          text: message.text || "",
          model,
          webSearch: useWebSearch,
          files: message.files,
        });
        setText("");
        setStatus("ready");
      } else if (chatId) {
        // Check for AI mention in DM/Group chats
        console.log("[Message Input] Checking for AI mention", {
          enableAIMention,
          aiName,
          messageText: message.text,
        });

        const mentionResult =
          enableAIMention && aiName
            ? detectAIMention(message.text || "", aiName)
            : null;

        console.log("[Message Input] Mention detection result:", mentionResult);

        // Send the user's message first
        await dispatch(
          sendMessage({
            chatId,
            body: message.text || "",
            clientId: `${Date.now()}-${Math.random()}`,
          }),
        ).unwrap();

        setText("");
        setStatus("ready");

        // If AI was mentioned, trigger the AI invocation callback
        if (mentionResult?.hasAIMention && onAIMention) {
          console.log("[Message Input] AI mentioned, invoking callback");
          await onAIMention({
            originalMessage: message.text || "",
            question: mentionResult.question,
            messageWithoutMention: mentionResult.messageWithoutMention,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(dict.errors.sendMessage);
      setStatus("error");
      // Don't clear text on error so user can retry
    }
  };

  const charCount = text.length;
  const showCharCount = charCount > 7000;
  const loading = externalLoading ?? reduxLoading.sending;
  const isDisabled = !text.trim() || charCount > 8000 || loading;

  // Check if any tools are enabled
  const hasTools =
    enableAttachments ||
    enableWebSearch ||
    enableMicrophone ||
    enableModelSelector;

  return (
    <div className="space-y-2" data-testid="message-input">
      <PromptInput
        globalDrop={enableAttachments}
        multiple={enableAttachments}
        onSubmit={handleSubmit}
      >
        {enableAttachments && (
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
        )}
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholderOverride || dict.messageInput.placeholder}
            value={text}
            data-testid="message-input-textarea"
          />
        </PromptInputBody>
        <PromptInputFooter>
          {hasTools && (
            <PromptInputTools>
              {enableAttachments && (
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              )}
              {enableMicrophone && (
                <PromptInputButton
                  onClick={handleMicrophoneToggle}
                  variant={useMicrophone ? "default" : "ghost"}
                >
                  <MicIcon size={16} />
                  <span className="sr-only">Microphone</span>
                </PromptInputButton>
              )}
              {enableWebSearch && (
                <PromptInputButton
                  onClick={handleWebSearchToggle}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
              )}
              {enableModelSelector && (
                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData?.chefSlug && (
                        <ModelSelectorLogo
                          provider={selectedModelData.chefSlug}
                        />
                      )}
                      {selectedModelData?.name && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {["OpenAI", "Anthropic", "Google"].map((chef) => (
                        <ModelSelectorGroup key={chef} heading={chef}>
                          {models
                            .filter((m) => m.chef === chef)
                            .map((m) => (
                              <ModelSelectorItem
                                key={m.id}
                                onSelect={() => handleModelSelect(m.id)}
                                value={m.id}
                              >
                                <ModelSelectorLogo provider={m.chefSlug} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                <ModelSelectorLogoGroup>
                                  {m.providers.map((provider) => (
                                    <ModelSelectorLogo
                                      key={provider}
                                      provider={provider}
                                    />
                                  ))}
                                </ModelSelectorLogoGroup>
                                {model === m.id ? (
                                  <CheckIcon className="ml-auto size-4" />
                                ) : (
                                  <div className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              )}
            </PromptInputTools>
          )}
          {!hasTools && <div />}
          <PromptInputSubmit
            disabled={isDisabled}
            status={loading ? "submitted" : status}
            data-testid="message-input-submit"
          />
        </PromptInputFooter>
      </PromptInput>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{dict.messageInput.shiftEnterHint}</span>
        {showCharCount && (
          <span className={charCount > 8000 ? "text-destructive" : ""}>
            {dict.messageInput.characterCount.replace(
              "{{count}}",
              charCount.toString(),
            )}
          </span>
        )}
      </div>
    </div>
  );
}
