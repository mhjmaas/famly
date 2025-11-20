"use client";

import { addDays, format, parseISO } from "date-fns";
import {
  AlertCircle,
  MoreVertical,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContributionGoal } from "@/types/api.types";

interface ContributionGoalCardProps {
  goal: ContributionGoal | null;
  isParent: boolean;
  memberName: string;
  onEdit: () => void;
  onAddDeduction: (amount: number, reason: string) => Promise<void>;
  onDeleteGoal?: () => void;
  showQuickDeduction?: boolean;
  latestDeductionLimit?: number;
  showCardActions?: boolean;
  isActionPending?: boolean;
  dict: {
    emptyState: {
      title: string;
      description: string;
      action: string;
    };
    card: {
      title: string;
      weekOf: string;
      karma: string;
      deductionsCount: string;
      noDeductions: string;
      onTrack: string;
      latestReduction: string;
    };
    dialog: {
      editTitle: string;
      deleteTitle: string;
    };
    deduction: {
      reasonPlaceholder: string;
      action: string;
      success: string;
      successDescription: string;
      errorTitle: string;
      errorInvalidInput: string;
      errorFailed: string;
    };
  };
}

export function ContributionGoalCard({
  goal,
  isParent,
  memberName,
  onEdit,
  onAddDeduction,
  onDeleteGoal,
  showQuickDeduction = false,
  latestDeductionLimit = 1,
  showCardActions = false,
  isActionPending = false,
  dict,
}: ContributionGoalCardProps) {
  const [deductionAmount, setDeductionAmount] = useState("1");
  const [deductionReason, setDeductionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDeduction = async () => {
    const amount = parseInt(deductionAmount, 10);
    if (!deductionReason || Number.isNaN(amount) || amount <= 0) {
      toast.error(dict.deduction.errorTitle, {
        description: dict.deduction.errorInvalidInput,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDeduction(amount, deductionReason);
      setDeductionAmount("1");
      setDeductionReason("");
      toast.success(dict.deduction.success, {
        description: dict.deduction.successDescription,
      });
    } catch (error) {
      toast.error(dict.deduction.errorTitle, {
        description:
          error instanceof Error ? error.message : dict.deduction.errorFailed,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty state for when no goal exists
  if (!goal) {
    if (!isParent) return null;

    return (
      <Card className="border-dashed" data-testid="empty-goal-state">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{dict.emptyState.title}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {dict.emptyState.description.replace("{memberName}", memberName)}
            </p>
          </div>
          <Button onClick={onEdit} data-testid="set-goal-button">
            {dict.emptyState.action}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = (goal.currentKarma / goal.maxKarma) * 100;
  const weekStart = parseISO(goal.weekStartDate);
  const weekEnd = addDays(weekStart, 6);
  const weekRange = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;
  const showActions = Boolean(showCardActions && isParent && goal);

  const latestDeductions = [...goal.deductions]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )
    .slice(0, latestDeductionLimit);

  return (
    <Card
      className="rounded-2xl border-primary/20 shadow-sm"
      data-testid="contribution-goal-card"
    >
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 self-start">
            <Badge
              variant="outline"
              className="whitespace-nowrap text-xs font-medium text-muted-foreground"
            >
              {dict.card.weekOf.replace("{date}", weekRange)}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid="goal-card-actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={onEdit}
                    data-testid="edit-goal-button"
                  >
                    {dict.dialog.editTitle}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteGoal}
                    disabled={!onDeleteGoal || isActionPending}
                    className="text-destructive focus:text-destructive"
                    data-testid="delete-goal-button"
                  >
                    {dict.dialog.deleteTitle}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Goal info and progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xl sm:text-2xl font-bold text-primary"
                data-testid="current-karma"
              >
                {goal.currentKarma}
              </span>
              <span className="text-sm text-muted-foreground">
                / {goal.maxKarma} {dict.card.karma}
              </span>
            </div>
          </div>
          <Progress
            value={progress}
            className="h-3"
            data-testid="goal-progress"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span data-testid="deductions-summary">
              {goal.deductions.length > 0
                ? dict.card.deductionsCount.replace(
                    "{count}",
                    String(
                      goal.deductions.reduce((sum, d) => sum + d.amount, 0),
                    ),
                  )
                : dict.card.noDeductions}
            </span>
            <span data-testid="progress-percentage">
              {Math.round(progress)}% {dict.card.onTrack}
            </span>
          </div>
        </div>

        {/* Latest deductions */}
        {latestDeductions.length > 0 && (
          <div
            className="space-y-3 pt-4 border-t"
            data-testid="deductions-list"
          >
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              {dict.card.latestReduction}
            </h4>
            <div className="space-y-2">
              {latestDeductions.map((deduction) => (
                <div
                  key={deduction._id}
                  className="flex items-start justify-between text-sm bg-muted/50 p-2 rounded"
                  data-testid={`deduction-${deduction._id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {deduction.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(deduction.createdAt), "EEE, MMM d")}
                    </p>
                  </div>
                  <span className="font-bold text-destructive ml-2 shrink-0">
                    -{deduction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick deduction form (parent only) */}
        {showQuickDeduction && isParent && (
          <div
            className="pt-4 border-t space-y-3"
            data-testid="quick-deduction-form"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder={dict.deduction.reasonPlaceholder}
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
                className="flex-1"
                data-testid="deduction-reason-input"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Select
                  value={deductionAmount}
                  onValueChange={setDeductionAmount}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className="w-[70px]"
                    data-testid="deduction-amount-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  className="shrink-0"
                  onClick={handleAddDeduction}
                  disabled={!deductionReason || isSubmitting}
                  data-testid="deduct-button"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  {dict.deduction.action}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
