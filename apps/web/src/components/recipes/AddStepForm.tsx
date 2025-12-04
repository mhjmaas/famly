"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/types";

interface AddStepFormProps {
  onAdd: (stepText: string) => Promise<void>;
  dict: Dictionary;
}

export function AddStepForm({ onAdd, dict }: AddStepFormProps) {
  const [stepText, setStepText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = dict.dashboard.pages.recipes.detail.steps.add;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(stepText.trim());
      setStepText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2"
      data-testid="recipe-add-step-form"
    >
      <Input
        value={stepText}
        onChange={(e) => setStepText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.placeholder}
        disabled={isSubmitting}
        className="flex-1"
        data-testid="recipe-add-step-input"
      />
      <Button
        type="submit"
        disabled={!stepText.trim() || isSubmitting}
        data-testid="recipe-add-step-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t.button}
      </Button>
    </form>
  );
}
