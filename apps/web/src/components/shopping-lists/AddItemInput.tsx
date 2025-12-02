"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddItemInputProps {
  placeholder: string;
  buttonLabel: string;
  onAdd: (name: string) => void;
  disabled?: boolean;
}

export function AddItemInput({
  placeholder,
  buttonLabel,
  onAdd,
  disabled = false,
}: AddItemInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t">
      <Input
        data-testid="shopping-list-add-item-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        data-testid="shopping-list-add-item-button"
        size="sm"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
      >
        <Plus className="h-4 w-4 mr-1" />
        {buttonLabel}
      </Button>
    </div>
  );
}
