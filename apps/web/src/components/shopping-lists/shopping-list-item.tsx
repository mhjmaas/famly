"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils/style-utils";
import type { ShoppingListItem as ShoppingListItemType } from "@/types/api.types";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (itemId: string, checked: boolean) => void;
  disabled?: boolean;
}

export function ShoppingListItem({
  item,
  onToggle,
  disabled = false,
}: ShoppingListItemProps) {
  return (
    <div data-testid="shopping-list-item" className="flex items-center gap-3">
      <Checkbox
        data-testid="shopping-list-item-checkbox"
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item._id, checked === true)}
        disabled={disabled}
      />
      <span
        data-testid="shopping-list-item-name"
        className={cn(
          "flex-1",
          item.checked && "line-through text-muted-foreground",
        )}
      >
        {item.name}
      </span>
    </div>
  );
}
