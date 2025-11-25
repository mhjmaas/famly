"use client";

import { Skeleton } from "@/components/ui/skeleton";

// Separate loading placeholder for the chat list
export function ChatListLoading() {
  const skeletonPlaceholders = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex-1 space-y-2 p-2">
        {skeletonPlaceholders.map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default ChatListLoading;
