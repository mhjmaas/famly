"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { DiaryView } from "@/components/diary";
import { Button } from "@/components/ui/button";

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

interface DiaryPageClientProps {
  dict: DiaryDict;
}

export function DiaryPageClient({ dict }: DiaryPageClientProps) {
  const [mobileActionTrigger, setMobileActionTrigger] = useState(0);

  return (
    <>
      {/* Mobile action button - rendered in parent via portal or passed down */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <Button
          size="icon"
          onClick={() => setMobileActionTrigger((prev) => prev + 1)}
          className="h-12 w-12 rounded-full shadow-lg"
          data-testid="diary-mobile-add-button"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <DiaryView dict={dict} mobileActionTrigger={mobileActionTrigger} />
    </>
  );
}
