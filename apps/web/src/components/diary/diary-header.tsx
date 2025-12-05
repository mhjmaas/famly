"use client";

import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/style-utils";

interface DiaryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  dict: {
    title: string;
    description: string;
    search: {
      placeholder: string;
    };
    datePicker: {
      label: string;
    };
  };
}

function formatDateRange(range: DateRange | undefined): string {
  if (!range?.from) return "";
  if (!range.to) return format(range.from, "MMM d, yyyy");
  if (range.from.getTime() === range.to.getTime()) {
    return format(range.from, "MMM d, yyyy");
  }
  return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
}

export function DiaryHeader({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  dict,
}: DiaryHeaderProps) {
  const hasDateFilter = dateRange?.from !== undefined;

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="diary-title">
            {dict.title}
          </h1>
          <p className="text-muted-foreground" data-testid="diary-description">
            {dict.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={dict.search.placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
              data-testid="diary-search-input"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(hasDateFilter && "border-primary")}
                data-testid="diary-date-picker"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {hasDateFilter
                  ? formatDateRange(dateRange)
                  : dict.datePicker.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex lg:hidden items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={dict.search.placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="diary-search-input-mobile"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(hasDateFilter && "border-primary")}
              data-testid="diary-date-picker-mobile"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
