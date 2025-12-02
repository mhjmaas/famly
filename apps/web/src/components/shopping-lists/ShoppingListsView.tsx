"use client";

import { format, isSameDay, isToday, isYesterday, startOfDay } from "date-fns";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dictionary } from "@/i18n/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem,
  createShoppingList,
  deleteShoppingList,
  fetchShoppingLists,
  selectShoppingLists,
  selectShoppingListsError,
  selectShoppingListsLoading,
  updateItem,
  updateShoppingList,
} from "@/store/slices/shopping-lists.slice";
import type { ShoppingList } from "@/types/api.types";
import { DeleteShoppingListDialog } from "./DeleteShoppingListDialog";
import { EmptyState } from "./EmptyState";
import { ShoppingListCard } from "./ShoppingListCard";
import { ShoppingListDialog } from "./ShoppingListDialog";

interface ListGroup {
  date: Date | null;
  lists: ShoppingList[];
}

interface ShoppingListsViewProps {
  dict: Dictionary;
  familyId: string;
}

export function ShoppingListsView({ dict, familyId }: ShoppingListsViewProps) {
  const dispatch = useAppDispatch();
  const lists = useAppSelector(selectShoppingLists);
  const isLoading = useAppSelector(selectShoppingListsLoading);
  const error = useAppSelector(selectShoppingListsError);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [deleteList, setDeleteList] = useState<ShoppingList | null>(null);

  const t = dict.dashboard.pages.shoppingLists;

  useEffect(() => {
    if (familyId) {
      dispatch(fetchShoppingLists(familyId));
    }
  }, [dispatch, familyId]);

  useEffect(() => {
    if (error) {
      toast.error(t.toast.error);
    }
  }, [error, t.toast.error]);

  // Format date separator like reference design
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group lists: active lists first (no date), then completed lists grouped by completion date
  const listGroups = useMemo((): ListGroup[] => {
    // Helper to check if a list is completed (all items checked)
    const isListCompleted = (list: ShoppingList) => {
      if (list.items.length === 0) return false;
      return list.items.every((item) => item.checked);
    };

    // Helper to get completion date from list (use updatedAt as proxy)
    const getCompletionDate = (list: ShoppingList): Date => {
      return new Date(list.updatedAt);
    };

    const groups: ListGroup[] = [];

    // Active lists (not completed)
    const activeLists = lists.filter((list) => !isListCompleted(list));

    // Completed lists sorted by completion date (most recent first)
    const completedLists = lists
      .filter((list) => isListCompleted(list))
      .sort(
        (a, b) =>
          getCompletionDate(b).getTime() - getCompletionDate(a).getTime(),
      );

    // Add active lists as first group (no date header)
    if (activeLists.length > 0) {
      groups.push({ date: null, lists: activeLists });
    }

    // Group completed lists by date
    for (const list of completedLists) {
      const listDate = startOfDay(getCompletionDate(list));
      const existingGroup = groups.find(
        (g) => g.date && isSameDay(g.date, listDate),
      );

      if (existingGroup) {
        existingGroup.lists.push(list);
      } else {
        groups.push({ date: listDate, lists: [list] });
      }
    }

    return groups;
  }, [lists]);

  const handleCreateOrUpdate = async (data: {
    name: string;
    tags: string[];
  }) => {
    try {
      if (editingList) {
        await dispatch(
          updateShoppingList({
            familyId,
            listId: editingList._id,
            data: { name: data.name, tags: data.tags },
          }),
        ).unwrap();
        toast.success(t.toast.updated);
      } else {
        await dispatch(
          createShoppingList({
            familyId,
            data: { name: data.name, tags: data.tags },
          }),
        ).unwrap();
        toast.success(t.toast.created);
      }
      setIsDialogOpen(false);
      setEditingList(null);
    } catch {
      toast.error(t.toast.error);
    }
  };

  const handleDelete = async () => {
    if (!deleteList) return;
    try {
      await dispatch(
        deleteShoppingList({ familyId, listId: deleteList._id }),
      ).unwrap();
      toast.success(t.toast.deleted);
      setDeleteList(null);
    } catch {
      toast.error(t.toast.error);
    }
  };

  const handleToggleItem = async (
    listId: string,
    itemId: string,
    checked: boolean,
  ) => {
    try {
      await dispatch(
        updateItem({ familyId, listId, itemId, data: { checked } }),
      ).unwrap();
    } catch {
      toast.error(t.toast.error);
    }
  };

  const handleAddItem = async (listId: string, name: string) => {
    try {
      await dispatch(addItem({ familyId, listId, data: { name } })).unwrap();
      toast.success(t.toast.itemAdded);
    } catch {
      toast.error(t.toast.error);
    }
  };

  const handleCheckAll = async (list: ShoppingList) => {
    const allChecked = list.items.every((i) => i.checked);
    const newChecked = !allChecked;

    try {
      await Promise.all(
        list.items.map((item) =>
          dispatch(
            updateItem({
              familyId,
              listId: list._id,
              itemId: item._id,
              data: { checked: newChecked },
            }),
          ).unwrap(),
        ),
      );
    } catch {
      toast.error(t.toast.error);
    }
  };

  const openEditDialog = (list: ShoppingList) => {
    setEditingList(list);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingList(null);
    setIsDialogOpen(true);
  };

  if (isLoading && lists.length === 0) {
    return (
      <div data-testid="shopping-lists-page" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="shopping-lists-page" className="space-y-6">
      {/* Header */}
      <div
        data-testid="shopping-lists-header"
        className="flex items-center justify-between"
      >
        <div>
          <h1
            data-testid="shopping-lists-title"
            className="text-2xl font-bold tracking-tight"
          >
            {t.title}
          </h1>
          <p
            data-testid="shopping-lists-description"
            className="text-muted-foreground"
          >
            {t.description}
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          data-testid="shopping-lists-create-button"
          className="hidden lg:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.newList}
        </Button>
      </div>

      {/* Content */}
      {lists.length === 0 ? (
        <EmptyState
          title={t.empty.title}
          description={t.empty.description}
          actionLabel={t.empty.action}
          onAction={openCreateDialog}
        />
      ) : (
        <div data-testid="shopping-lists-list" className="space-y-6">
          {listGroups.map((group) => (
            <div
              key={group.date?.toISOString() ?? "active"}
              className="space-y-3"
            >
              {/* Date separator for completed lists */}
              {group.date && (
                <div
                  className="flex items-center gap-3 py-2"
                  data-testid="shopping-lists-date-separator"
                >
                  <div className="h-px bg-border flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Completed {formatDateSeparator(group.date)}
                  </span>
                  <div className="h-px bg-border flex-1" />
                </div>
              )}
              {/* List cards */}
              {group.lists.map((list) => (
                <ShoppingListCard
                  key={list._id}
                  list={list}
                  onEdit={() => openEditDialog(list)}
                  onDelete={() => setDeleteList(list)}
                  onToggleItem={(itemId, checked) =>
                    handleToggleItem(list._id, itemId, checked)
                  }
                  onAddItem={(name) => handleAddItem(list._id, name)}
                  onCheckAll={() => handleCheckAll(list)}
                  translations={{
                    itemCount: t.card.itemCount,
                    noItems: t.card.noItems,
                    checkAll: t.card.checkAll,
                    uncheckAll: t.card.uncheckAll,
                    addItem: t.card.addItem,
                    add: t.card.add,
                    edit: t.menu.edit,
                    delete: t.menu.delete,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Mobile Create Button - inline like TasksView */}
      <Button
        onClick={openCreateDialog}
        className="w-full lg:hidden gap-2"
        data-testid="shopping-lists-create-button-mobile"
      >
        <Plus className="h-4 w-4" />
        {t.newList}
      </Button>

      {/* Dialogs */}
      <ShoppingListDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingList(null);
        }}
        editingList={editingList}
        onSubmit={handleCreateOrUpdate}
        translations={{
          createTitle: t.dialog.createTitle,
          editTitle: t.dialog.editTitle,
          nameLabel: t.dialog.nameLabel,
          namePlaceholder: t.dialog.namePlaceholder,
          tagsLabel: t.dialog.tagsLabel,
          tagsPlaceholder: t.dialog.tagsPlaceholder,
          addTags: t.dialog.addTags,
          cancel: t.dialog.cancel,
          create: t.dialog.create,
          update: t.dialog.update,
        }}
      />

      <DeleteShoppingListDialog
        open={!!deleteList}
        onOpenChange={(open) => !open && setDeleteList(null)}
        listName={deleteList?.name || ""}
        onConfirm={handleDelete}
        translations={{
          title: t.deleteDialog.title,
          description: t.deleteDialog.description,
          cancel: t.deleteDialog.cancel,
          confirm: t.deleteDialog.confirm,
        }}
      />
    </div>
  );
}
