"use client";

import { format } from "date-fns";
import { ArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createDiaryEntry,
  fetchDiaryEntries,
  selectDiaryEntries,
  selectDiaryLoading,
} from "@/store/slices/diary.slice";
import type { DiaryEntry } from "@/types/api.types";
import { DiaryEmptyState } from "./DiaryEmptyState";
import { DiaryEntryForm } from "./DiaryEntryForm";
import { DiaryEntryGroup } from "./DiaryEntryGroup";
import { DiaryFilters } from "./DiaryFilters";
import { DiaryHeader } from "./DiaryHeader";

interface DiaryDict {
  title: string;
  description: string;
  newEntry: {
    title: string;
    placeholder: string;
    submit: string;
    submitting: string;
  };
  search: {
    placeholder: string;
  };
  datePicker: {
    label: string;
  };
  filters: {
    showing: string;
    showingDate: string;
    showingDateRange: string;
    clear: string;
  };
  emptyState: {
    description: string;
    noResults: string;
  };
  error: {
    fetch: string;
    create: string;
  };
  success: {
    create: string;
  };
}

interface DiaryViewProps {
  dict: DiaryDict;
  mobileActionTrigger?: number;
}

interface EntryGroup {
  date: string;
  entries: DiaryEntry[];
}

export function DiaryView({ dict, mobileActionTrigger }: DiaryViewProps) {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectDiaryEntries);
  const isLoading = useAppSelector(selectDiaryLoading);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showGoToTop, setShowGoToTop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch entries on mount
  useEffect(() => {
    dispatch(fetchDiaryEntries());
  }, [dispatch]);

  // Handle scroll for go-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && topRef.current) {
        const topPosition = topRef.current.getBoundingClientRect().top;
        setShowGoToTop(topPosition < -100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile action trigger
  useEffect(() => {
    if (mobileActionTrigger && mobileActionTrigger > 0) {
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mobileActionTrigger]);

  // Filter entries based on search and date range
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.entry.toLowerCase().includes(query),
      );
    }

    if (dateRange?.from) {
      const startDate = format(dateRange.from, "yyyy-MM-dd");
      const endDate = dateRange.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : startDate;
      filtered = filtered.filter(
        (entry) => entry.date >= startDate && entry.date <= endDate,
      );
    }

    return filtered;
  }, [entries, searchQuery, dateRange]);

  // Group entries by date
  const entryGroups = useMemo(() => {
    const groups: EntryGroup[] = [];

    filteredEntries.forEach((entry) => {
      const dateKey = entry.date;
      const existingGroup = groups.find((g) => g.date === dateKey);

      if (existingGroup) {
        existingGroup.entries.push(entry);
      } else {
        groups.push({ date: dateKey, entries: [entry] });
      }
    });

    // Sort groups by date descending
    groups.sort((a, b) => b.date.localeCompare(a.date));

    // Sort entries within each group by createdAt descending
    groups.forEach((group) => {
      group.entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });

    return groups;
  }, [filteredEntries]);

  const isFiltered = Boolean(searchQuery || dateRange?.from);

  const handleCreateEntry = async (content: string) => {
    setIsSubmitting(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      await dispatch(
        createDiaryEntry({
          date: today,
          entry: content,
        }),
      ).unwrap();
      // Success notification is handled by websocket activity events
    } catch {
      toast.error(dict.error.create);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
  };

  const handleGoToTop = () => {
    handleClearFilters();
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <div ref={topRef}>
        <DiaryHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dict={dict}
        />
      </div>

      <DiaryEntryForm
        onSubmit={handleCreateEntry}
        isSubmitting={isSubmitting}
        mobileActionTrigger={mobileActionTrigger}
        dict={dict}
      />

      <DiaryFilters
        searchQuery={searchQuery}
        dateRange={dateRange}
        onClearFilters={handleClearFilters}
        dict={dict}
      />

      <div className="space-y-4" data-testid="diary-entries-list">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {dict.error.fetch.replace("Failed to load", "Loading")}...
          </div>
        ) : entryGroups.length === 0 ? (
          <DiaryEmptyState isFiltered={isFiltered} dict={dict} />
        ) : (
          <div className="space-y-6">
            {entryGroups.map((group) => (
              <DiaryEntryGroup
                key={group.date}
                date={group.date}
                entries={group.entries}
              />
            ))}
          </div>
        )}
      </div>

      {(showGoToTop || isFiltered) && (
        <Button
          onClick={handleGoToTop}
          className="fixed bottom-8 right-8 rounded-full shadow-lg h-12 w-12 p-0"
          size="icon"
          data-testid="diary-scroll-top-button"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
