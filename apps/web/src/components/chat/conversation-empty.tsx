"use client";

import { MessageCircle } from "lucide-react";

interface ConversationEmptyProps {
  title: string;
  description: string;
}

export function ConversationEmpty({
  title,
  description,
}: ConversationEmptyProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 text-center"
      data-testid="conversation-empty"
    >
      <MessageCircle className="h-16 w-16 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
