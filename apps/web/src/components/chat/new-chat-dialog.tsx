"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch } from "@/store/hooks";
import { createChat, selectChat } from "@/store/slices/chat.slice";

interface NewChatDialogProps {
  dict: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMembers: any[];
}

export function NewChatDialog({
  dict,
  open,
  onOpenChange,
  familyMembers,
}: NewChatDialogProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreateDM = async (memberId: string) => {
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
      onOpenChange(false);
      toast.success("Chat created");
    } catch (error) {
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
      onOpenChange(false);
      setGroupTitle("");
      setSelectedMembers([]);
      toast.success("Group chat created");
    } catch (error) {
      toast.error(dict.errors.createChat);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dict.newChatDialog.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dm">{dict.newChatDialog.dm.title}</TabsTrigger>
            <TabsTrigger value="group">
              {dict.newChatDialog.group.title}
            </TabsTrigger>
          </TabsList>

          {/* DM Tab */}
          <TabsContent value="dm" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dict.newChatDialog.dm.selectMember}
            </p>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {familyMembers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  {dict.newChatDialog.dm.noMembers}
                </p>
              ) : (
                <>
                  {familyMembers.map((member) => (
                    <button
                      key={member.memberId}
                      type="button"
                      onClick={() => handleCreateDM(member.memberId)}
                      disabled={loading}
                      className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-accent disabled:opacity-50"
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
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* Group Tab */}
          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-title">
                {dict.newChatDialog.group.titleLabel}
              </Label>
              <Input
                id="group-title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder={dict.newChatDialog.group.titlePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label>{dict.newChatDialog.group.selectMembers}</Label>
              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                {familyMembers.map((member) => {
                  const isChecked = selectedMembers.includes(member.memberId);
                  return (
                    <div
                      key={member.memberId}
                      className="flex items-center gap-3 rounded-lg p-2"
                    >
                      <Checkbox
                        id={`member-${member.memberId}`}
                        checked={isChecked}
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

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {dict.newChatDialog.cancel}
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={
                  loading || !groupTitle.trim() || selectedMembers.length < 2
                }
              >
                {loading
                  ? dict.newChatDialog.creating
                  : dict.newChatDialog.group.create}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
