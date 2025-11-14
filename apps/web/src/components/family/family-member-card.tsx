"use client";

import { MoreVertical, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FamilyMember } from "@/lib/api-client";
import { calculateAge, getInitials } from "@/lib/utils/family-utils";
import { useAppSelector } from "@/store/hooks";
import { selectKarmaBalance } from "@/store/slices/karma.slice";

interface FamilyMemberCardProps {
  member: FamilyMember;
  currentUserRole: "Parent" | "Child";
  onEditRole: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
  onGiveKarma: (member: FamilyMember) => void;
  dict: {
    memberCard: {
      yearsOld: string;
      karma: string;
      roleParent: string;
      roleChild: string;
      actions: {
        giveKarma: string;
        editRole: string;
        remove: string;
      };
    };
  };
}

export function FamilyMemberCard({
  member,
  currentUserRole,
  onEditRole,
  onRemove,
  onGiveKarma,
  dict,
}: FamilyMemberCardProps) {
  const isParent = currentUserRole === "Parent";
  const age = calculateAge(member.birthdate);
  const initials = getInitials(member.name);

  // Read karma from karma slice (single source of truth)
  const memberKarma = useAppSelector(selectKarmaBalance(member.memberId));

  return (
    <Card
      className="hover:shadow-lg transition-shadow"
      data-testid="family-member-card"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg" data-testid="member-name">
                {member.name}
              </h3>
              <p
                className="text-sm text-muted-foreground"
                data-testid="member-age"
              >
                {age} {dict.memberCard.yearsOld}
              </p>
            </div>
          </div>
          {isParent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-testid="member-actions-button"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onGiveKarma(member)}
                  data-testid="action-give-karma"
                >
                  {dict.memberCard.actions.giveKarma}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEditRole(member)}
                  data-testid="action-edit-role"
                >
                  {dict.memberCard.actions.editRole}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRemove(member)}
                  className="text-destructive focus:text-destructive"
                  data-testid="action-remove-member"
                >
                  {dict.memberCard.actions.remove}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge
            variant={member.role === "Parent" ? "default" : "secondary"}
            className={
              member.role === "Parent"
                ? "bg-primary/10 text-primary"
                : "bg-chart-2/10 text-chart-2"
            }
            data-testid="member-role"
          >
            {member.role === "Parent"
              ? dict.memberCard.roleParent
              : dict.memberCard.roleChild}
          </Badge>
          <div
            className="flex items-center gap-2 text-primary"
            data-testid="member-karma"
          >
            <Sparkles className="h-5 w-5 fill-primary" />
            <span className="font-semibold text-base">{memberKarma}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
