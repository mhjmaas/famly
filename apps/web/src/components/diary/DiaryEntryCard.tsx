"use client";

import { format, parseISO } from "date-fns";
import { BookOpen } from "lucide-react";
import type { DiaryEntry } from "@/types/api.types";

interface DiaryEntryCardProps {
  entry: DiaryEntry;
}

export function DiaryEntryCard({ entry }: DiaryEntryCardProps) {
  // Parse the createdAt ISO string to get the time
  const createdAtDate = parseISO(entry.createdAt);

  return (
    <div
      className="p-4 rounded-lg hover:bg-accent/50 transition-colors"
      data-testid="diary-entry-card"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-full p-3 bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            data-testid="diary-entry-content"
          >
            {entry.entry}
          </p>
          <p
            className="text-xs text-muted-foreground mt-2"
            data-testid="diary-entry-time"
          >
            {format(createdAtDate, "h:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
}
