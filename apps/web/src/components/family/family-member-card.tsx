"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FamilyMember } from "@/lib/api-client";
import { calculateAge, getInitials } from "@/lib/utils/family-utils";
import { useAppSelector } from "@/store/hooks";
import { selectKarmaBalance } from "@/store/slices/karma.slice";

interface FamilyMemberCardProps {
  member: FamilyMember;
  dict: {
    memberCard: {
      yearsOld: string;
      karma: string;
      roleParent: string;
      roleChild: string;
      viewDetails: string;
    };
  };
  lang: string;
}

export function FamilyMemberCard({
  member,
  dict,
  lang,
}: FamilyMemberCardProps) {
  const age = calculateAge(member.birthdate);
  const initials = getInitials(member.name);

  // Read karma from karma slice (single source of truth)
  const memberKarma = useAppSelector(selectKarmaBalance(member.memberId));

  return (
    <Card
      className="hover:shadow-lg transition-shadow"
      data-testid="family-member-card"
    >
      <CardContent>
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

        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
            data-testid="member-view-details-link"
          >
            <Link href={`/${lang}/app/family/${member.memberId}`}>
              {dict.memberCard.viewDetails}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
