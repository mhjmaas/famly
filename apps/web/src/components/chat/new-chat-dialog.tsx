"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createChat, selectChat, selectChats } from "@/store/slices/chat.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { FamilyMember } from "@/types/api.types";

interface NewChatDialogProps {
  dict: {
    newChatDialog: {
      title: string;
      dm: {
        title: string;
        selectMember: string;
        noMembers: string;
      };
      group: {
        title: string;
        titleLabel: string;
        titlePlaceholder: string;
        selectMembers: string;
        minMembers: string;
        create: string;
      };
      cancel: string;
      creating: string;
    };
    errors: {
      createChat: string;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatSelected?: (chatId: string) => void;
  familyMembers: readonly FamilyMember[];
}

export function NewChatDialog({
  dict,
  open,
  onOpenChange,
  onChatSelected,
  familyMembers,
}: NewChatDialogProps) {
  const dispatch = useAppDispatch();
  const chats = useAppSelector(selectChats);
  const currentUser = useAppSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCreateDM = async (memberId: string) => {
    // Guard: prevent creating a DM with yourself
    if (currentUser?.id && memberId === currentUser.id) {
      toast.error("You cannot start a DM with yourself");
      return;
    }

    // Guard: if a DM already exists with this member, just select it
    const existingDm = chats.find(
      (chat) =>
        chat.type === "dm" &&
        chat.memberIds.includes(memberId) &&
        (currentUser?.id ? chat.memberIds.includes(currentUser.id) : true),
    );

    if (existingDm) {
      dispatch(selectChat(existingDm._id));
      onChatSelected?.(existingDm._id);
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(
        createChat({
          type: "dm",
          memberIds: [memberId],
        }),
      ).unwrap();

      // Select the new chat
      await dispatch(selectChat(result._id));
      onChatSelected?.(result._id);
      onOpenChange(false);
      toast.success("Chat created");
    } catch (error) {
      console.error(error);
      toast.error(dict.errors.createChat);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || selectedMembers.length < 2) return;

    setLoading(true);
    try {
      const result = await dispatch(
        createChat({
          type: "group",
          memberIds: selectedMembers,
          title: groupTitle.trim(),
        }),
      ).unwrap();

      // Select the new chat
      dispatch(selectChat(result._id));
      onChatSelected?.(result._id);
      onOpenChange(false);
      setGroupTitle("");
      setSelectedMembers([]);
      toast.success("Group chat created");
    } catch (error) {
      console.error(error);
      toast.error(dict.errors.createChat);
    } finally {
      setLoading(false);
    }
  };

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle data-testid="new-chat-dialog-title">
          {dict.newChatDialog.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Start a direct message or create a group chat with family members.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "dm" | "group")}
        className="w-full"
      >
        <div className="flex justify-center mb-4">
          <TabsList className="inline-flex items-center rounded-full bg-muted/60 p-1 shadow-sm">
            <TabsTrigger
              value="dm"
              className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              data-testid="new-chat-dm-tab"
            >
              {dict.newChatDialog.dm.title}
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
              data-testid="new-chat-group-tab"
            >
              {dict.newChatDialog.group.title}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* DM Tab */}
        <TabsContent value="dm" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            {dict.newChatDialog.dm.selectMember}
          </p>
          <div
            className="max-h-[300px] space-y-2 overflow-y-auto"
            data-testid="new-chat-member-list"
          >
            {familyMembers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {dict.newChatDialog.dm.noMembers}
              </p>
            ) : (
              familyMembers.map((member) => (
                <button
                  key={member.memberId}
                  type="button"
                  onClick={() => handleCreateDM(member.memberId)}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-accent disabled:opacity-50"
                  data-testid="new-chat-member-item"
                >
                  <Avatar>
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* Group Tab */}
        <TabsContent value="group" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="group-title">
              {dict.newChatDialog.group.titleLabel}
            </Label>
            <Input
              id="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder={dict.newChatDialog.group.titlePlaceholder}
              data-testid="new-chat-group-title"
            />
          </div>

          <div className="space-y-2">
            <Label>{dict.newChatDialog.group.selectMembers}</Label>
            <div className="max-h-[200px] space-y-2 overflow-y-auto">
              {familyMembers
                .filter((member) => member.memberId !== currentUser?.id)
                .map((member) => {
                  const isChecked = selectedMembers.includes(member.memberId);
                  return (
                    <div
                      key={member.memberId}
                      className="flex items-center gap-3 rounded-lg p-2"
                    >
                      <Checkbox
                        id={`member-${member.memberId}`}
                        checked={isChecked}
                        data-testid="new-chat-member-checkbox"
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMembers((prev) => [
                              ...prev,
                              member.memberId,
                            ]);
                          } else {
                            setSelectedMembers((prev) =>
                              prev.filter((id) => id !== member.memberId),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`member-${member.memberId}`}
                        className="flex flex-1 cursor-pointer items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </label>
                    </div>
                  );
                })}
            </div>
            {selectedMembers.length < 2 && (
              <p className="text-sm text-muted-foreground">
                {dict.newChatDialog.group.minMembers}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );

  const footerActions = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={loading}
        data-testid="new-chat-cancel"
      >
        {dict.newChatDialog.cancel}
      </Button>
      {activeTab === "group" && (
        <Button
          onClick={handleCreateGroup}
          disabled={loading || !groupTitle.trim() || selectedMembers.length < 2}
          data-testid="new-chat-create-group"
        >
          {loading
            ? dict.newChatDialog.creating
            : dict.newChatDialog.group.create}
        </Button>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto gap-6"
          data-testid="new-chat-dialog"
        >
          <div className="flex flex-col gap-6">{dialogContent}</div>
          <div className="flex flex-wrap justify-end gap-2">
            {footerActions}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent data-testid="new-chat-dialog">
        <DrawerHeader>
          <DrawerTitle data-testid="new-chat-dialog-title">
            {dict.newChatDialog.title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto max-h-[65vh]">
          <div className="flex flex-col gap-6">{dialogContent}</div>
        </div>
        <DrawerFooter className="pt-2">
          {activeTab === "group" && (
            <Button
              onClick={handleCreateGroup}
              disabled={
                loading || !groupTitle.trim() || selectedMembers.length < 2
              }
              data-testid="new-chat-create-group"
            >
              {loading
                ? dict.newChatDialog.creating
                : dict.newChatDialog.group.create}
            </Button>
          )}
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              data-testid="new-chat-cancel"
            >
              {dict.newChatDialog.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
