"use client";

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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectChatLoading, sendMessage } from "@/store/slices/chat.slice";
import { CheckIcon, GlobeIcon, MicIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

interface MessageInputProps {
  chatId: string;
  dict: any;
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
}

export function MessageInput({
  chatId,
  dict,
  enableAttachments = false,
  enableWebSearch = false,
  enableMicrophone = false,
  enableModelSelector = false,
  onWebSearchToggle,
  onMicrophoneToggle,
  onModelChange,
  defaultModel = models[0].id,
}: MessageInputProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectChatLoading);
  const [text, setText] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
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
      await dispatch(
        sendMessage({
          chatId,
          body: message.text || "",
          clientId: `${Date.now()}-${Math.random()}`,
          // Future: pass attachments, model, webSearch settings
          // attachments: message.files,
          // model: model,
          // webSearch: useWebSearch,
        }),
      ).unwrap();

      setText("");
      setStatus("ready");
    } catch (error) {
      toast.error(dict.errors.sendMessage);
      setStatus("error");
      // Don't clear text on error so user can retry
    }
  };

  const charCount = text.length;
  const showCharCount = charCount > 7000;
  const isDisabled = !text.trim() || charCount > 8000 || loading.sending;

  // Check if any tools are enabled
  const hasTools =
    enableAttachments || enableWebSearch || enableMicrophone || enableModelSelector;

  return (
    <div className="space-y-2">
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
            placeholder={dict.messageInput.placeholder}
            value={text}
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
                        <ModelSelectorLogo provider={selectedModelData.chefSlug} />
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
            status={loading.sending ? "submitted" : status}
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
