"use client";

import { Bot, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversationHeaderProps {
  title: string;
  isAIChat: boolean;
  isStreaming: boolean;
  /** Callback to clear chat history (only for AI chats) */
  onClearChat?: () => void;
  /** Whether clear chat is in progress */
  isClearingChat?: boolean;
  /** Dictionary for i18n */
  dict?: {
    clearChat?: {
      button: string;
      title: string;
      description: string;
      cancel: string;
      confirm: string;
    };
  };
}

export function ConversationHeader({
  title,
  isAIChat,
  isStreaming,
  onClearChat,
  isClearingChat = false,
  dict,
}: ConversationHeaderProps) {
  return (
    <div
      className="border-b border-border p-4"
      data-testid="conversation-header"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAIChat && <Bot className="h-5 w-5 text-primary" />}
          <h2
            className="text-lg font-semibold"
            data-testid="conversation-title"
          >
            {title}
          </h2>
          {isStreaming && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Clear chat button - only for AI chats */}
        {isAIChat && onClearChat && (
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isClearingChat || isStreaming}
                    data-testid="clear-chat-button"
                  >
                    {isClearingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                {dict?.clearChat?.button || "Clear chat history"}
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {dict?.clearChat?.title || "Clear chat history?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {dict?.clearChat?.description ||
                    "This will permanently delete all messages in this conversation. This action cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {dict?.clearChat?.cancel || "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction onClick={onClearChat}>
                  {dict?.clearChat?.confirm || "Clear history"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
