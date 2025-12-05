"use client";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";

interface DiaryFiltersProps {
  searchQuery: string;
  dateRange: DateRange | undefined;
  onClearFilters: () => void;
  dict: {
    filters: {
      showing: string;
      showingDate: string;
      showingDateRange: string;
      clear: string;
    };
  };
}

function formatDateRangeDisplay(range: DateRange | undefined): string {
  if (!range?.from) return "";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "MMMM d, yyyy");
  }
  return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
}

export function DiaryFilters({
  searchQuery,
  dateRange,
  onClearFilters,
  dict,
}: DiaryFiltersProps) {
  const hasDateFilter = dateRange?.from !== undefined;
  const isFiltered = searchQuery || hasDateFilter;

  if (!isFiltered) return null;

  const isDateRange =
    dateRange?.to && dateRange.from?.getTime() !== dateRange.to.getTime();

  return (
    <div
      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
      data-testid="diary-active-filters"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {searchQuery && (
          <span>
            {dict.filters.showing}{" "}
            <span className="font-semibold text-foreground">
              "{searchQuery}"
            </span>
          </span>
        )}
        {hasDateFilter && (
          <span>
            {isDateRange
              ? dict.filters.showingDateRange
              : dict.filters.showingDate}{" "}
            <span className="font-semibold text-foreground">
              {formatDateRangeDisplay(dateRange)}
            </span>
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        data-testid="diary-clear-filters"
      >
        {dict.filters.clear}
      </Button>
    </div>
  );
}
