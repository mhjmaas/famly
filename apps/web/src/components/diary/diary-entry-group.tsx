"use client";

import { format, parseISO } from "date-fns";
import type { DiaryEntry } from "@/types/api.types";
import { DiaryEntryCard } from "./diary-entry-card";

interface DiaryEntryGroupProps {
  date: string; // YYYY-MM-DD format
  entries: DiaryEntry[];
}

export function DiaryEntryGroup({ date, entries }: DiaryEntryGroupProps) {
  const dateObj = parseISO(date);

  return (
    <div className="space-y-3" data-testid="diary-entry-group">
      <div className="flex items-center gap-3 py-2">
        <div className="h-px bg-border flex-1" />
        <span
          className="text-sm font-medium text-muted-foreground"
          data-testid="diary-group-date"
        >
          {format(dateObj, "EEEE, MMMM d, yyyy")}
        </span>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <DiaryEntryCard key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
