"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface DiaryEntryFormProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  mobileActionTrigger?: number;
  dict: {
    newEntry: {
      title: string;
      placeholder: string;
      submit: string;
      submitting: string;
    };
  };
}

export function DiaryEntryForm({
  onSubmit,
  isSubmitting,
  mobileActionTrigger,
  dict,
}: DiaryEntryFormProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mobileActionTrigger && mobileActionTrigger > 0) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [mobileActionTrigger]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    await onSubmit(content.trim());
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card data-testid="diary-entry-form">
      <CardHeader>
        <CardTitle>{dict.newEntry.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          ref={textareaRef}
          id="new-entry"
          placeholder={dict.newEntry.placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="resize-none"
          data-testid="diary-entry-input"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            data-testid="diary-submit-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? dict.newEntry.submitting : dict.newEntry.submit}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
