"use client";

import { CheckCheck, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/style-utils";
import type { ShoppingList } from "@/types/api.types";
import { AddItemInput } from "./AddItemInput";
import { ShoppingListItem } from "./ShoppingListItem";

interface ShoppingListCardProps {
  list: ShoppingList;
  onEdit: () => void;
  onDelete: () => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onAddItem: (name: string) => void;
  onCheckAll: () => void;
  translations: {
    itemCount: string;
    noItems: string;
    checkAll: string;
    uncheckAll: string;
    addItem: string;
    add: string;
    edit: string;
    delete: string;
  };
}

export function ShoppingListCard({
  list,
  onEdit,
  onDelete,
  onToggleItem,
  onAddItem,
  onCheckAll,
  translations,
}: ShoppingListCardProps) {
  const checkedCount = list.items.filter((i) => i.checked).length;
  const totalCount = list.items.length;
  const isCompleted = totalCount > 0 && checkedCount === totalCount;
  const allChecked = isCompleted;

  const itemCountText =
    totalCount > 0
      ? translations.itemCount
          .replace("{checked}", String(checkedCount))
          .replace("{total}", String(totalCount))
      : translations.noItems;

  return (
    <Card
      data-testid="shopping-list-card"
      className={cn(isCompleted && "opacity-60")}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  data-testid="shopping-list-name"
                  className={cn(
                    "font-semibold",
                    isCompleted && "line-through text-muted-foreground",
                  )}
                >
                  {list.name}
                </h3>
                {list.tags.length > 0 && (
                  <div
                    data-testid="shopping-list-tags"
                    className="hidden md:flex flex-wrap gap-1"
                  >
                    {list.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                        data-testid="shopping-list-tag"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p
                data-testid="shopping-list-item-count"
                className="text-sm text-muted-foreground"
              >
                {itemCountText}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isCompleted && totalCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCheckAll}
                  data-testid="shopping-list-check-all"
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  {allChecked ? translations.uncheckAll : translations.checkAll}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid="shopping-list-menu-button"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  data-testid="shopping-list-menu"
                >
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="gap-2"
                    data-testid="shopping-list-action-edit"
                  >
                    <Pencil className="h-4 w-4" />
                    {translations.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-destructive"
                    data-testid="shopping-list-action-delete"
                  >
                    <Trash2 className="h-4 w-4" />
                    {translations.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Items */}
          {list.items.length > 0 && (
            <div className="space-y-1 pl-2">
              {list.items.map((item) => (
                <ShoppingListItem
                  key={item._id}
                  item={item}
                  onToggle={onToggleItem}
                />
              ))}
            </div>
          )}

          {/* Add item input - only show for active lists */}
          {!isCompleted && (
            <AddItemInput
              placeholder={translations.addItem}
              buttonLabel={translations.add}
              onAdd={onAddItem}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
