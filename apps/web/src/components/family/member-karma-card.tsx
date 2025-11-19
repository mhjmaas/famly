"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FamilyMember } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMemberActivityEvents } from "@/store/slices/activities.slice";
import {
  grantMemberKarma,
  selectOperationLoading,
} from "@/store/slices/family.slice";

interface MemberKarmaCardProps {
  member: FamilyMember;
  familyId: string;
  isParent: boolean;
  dict: {
    pages: {
      memberDetail: {
        karmaCard: {
          amountLabel: string;
          amountPlaceholder: string;
          amountHelper: string;
          descriptionLabel: string;
          descriptionPlaceholder: string;
          giveButton: string;
          deductButton: string;
          success: string;
          error: string;
        };
      };
    };
  };
}

export function MemberKarmaCard({
  member,
  familyId,
  isParent,
  dict,
}: MemberKarmaCardProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectOperationLoading("grantKarma"));

  const [karmaAmount, setKarmaAmount] = useState("");
  const [description, setDescription] = useState("");

  const parsedAmount = Number.parseInt(karmaAmount, 10);
  const isNegative = !Number.isNaN(parsedAmount) && parsedAmount < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number.parseInt(karmaAmount, 10);

    if (Number.isNaN(amount) || amount === 0) {
      toast.error("Invalid amount", {
        description:
          "Please enter a valid karma amount (positive or negative).",
      });
      return;
    }

    if (!description.trim()) {
      toast.error("Description required", {
        description: "Please provide a description for the karma change.",
      });
      return;
    }

    try {
      await dispatch(
        grantMemberKarma({
          familyId,
          userId: member.memberId,
          amount,
          description: description.trim(),
        }),
      ).unwrap();

      toast.success(dict.pages.memberDetail.karmaCard.success, {
        description: `${amount > 0 ? "Gave" : "Deducted"} ${Math.abs(amount)} karma ${amount > 0 ? "to" : "from"} ${member.name}`,
      });

      // Refresh activity timeline to show the new karma event
      dispatch(
        fetchMemberActivityEvents({
          familyId,
          memberId: member.memberId,
        }),
      );

      // Clear form
      setKarmaAmount("");
      setDescription("");
    } catch (error) {
      toast.error(dict.pages.memberDetail.karmaCard.error, {
        description:
          error instanceof Error ? error.message : "Failed to update karma",
      });
    }
  };

  return (
    <Card data-testid="member-karma-card">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="karma-amount" data-testid="karma-amount-label">
              {dict.pages.memberDetail.karmaCard.amountLabel}
            </Label>
            <Input
              id="karma-amount"
              type="number"
              placeholder={dict.pages.memberDetail.karmaCard.amountPlaceholder}
              value={karmaAmount}
              onChange={(e) => setKarmaAmount(e.target.value)}
              disabled={!isParent || isLoading}
              data-testid="karma-amount-input"
            />
            <p className="text-xs text-muted-foreground">
              {dict.pages.memberDetail.karmaCard.amountHelper}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="karma-description"
              data-testid="karma-description-label"
            >
              {dict.pages.memberDetail.karmaCard.descriptionLabel}
            </Label>
            <Textarea
              id="karma-description"
              placeholder={
                dict.pages.memberDetail.karmaCard.descriptionPlaceholder
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={!isParent || isLoading}
              data-testid="karma-description-input"
            />
          </div>

          <Button
            type="submit"
            variant={isNegative ? "destructive" : "default"}
            className="w-full gap-2"
            disabled={!isParent || isLoading}
            data-testid="give-karma-button"
          >
            <Sparkles className="h-4 w-4" />
            {isNegative
              ? dict.pages.memberDetail.karmaCard.deductButton
              : dict.pages.memberDetail.karmaCard.giveButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
