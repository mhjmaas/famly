"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/types";

interface RecipeSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onClear: () => void;
  resultsCount: number;
  isSearching: boolean;
  dict: Dictionary;
}

export function RecipeSearch({
  searchQuery,
  onSearch,
  onClear,
  resultsCount,
  isSearching,
  dict,
}: RecipeSearchProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const t = dict.dashboard.pages.recipes.search;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        onSearch(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, searchQuery, onSearch]);

  // Sync input with external searchQuery changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleClear = useCallback(() => {
    setInputValue("");
    onClear();
  }, [onClear]);

  return (
    <div className="space-y-2" data-testid="recipes-search">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t.placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-9 pr-9"
          data-testid="recipes-search-input"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
            data-testid="recipes-search-clear"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t.clear}</span>
          </Button>
        )}
      </div>
      {searchQuery && (
        <div
          className="text-sm text-muted-foreground"
          data-testid="recipes-search-results-count"
        >
          {isSearching
            ? "..."
            : t.resultsCount.replace("{count}", resultsCount.toString())}
        </div>
      )}
    </div>
  );
}
