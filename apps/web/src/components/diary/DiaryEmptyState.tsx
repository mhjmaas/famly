"use client";

import { BookOpen } from "lucide-react";

interface DiaryEmptyStateProps {
  isFiltered: boolean;
  dict: {
    emptyState: {
      description: string;
      noResults: string;
    };
  };
}

export function DiaryEmptyState({ isFiltered, dict }: DiaryEmptyStateProps) {
  return (
    <div className="text-center py-12" data-testid="diary-empty-state">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">
        {isFiltered ? dict.emptyState.noResults : dict.emptyState.description}
      </p>
    </div>
  );
}
