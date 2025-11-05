"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { FamilyMember } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  grantMemberKarma,
  selectOperationError,
  selectOperationLoading,
} from "@/store/slices/family.slice";

interface GiveKarmaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: {
    giveKarmaDialog: {
      title: string;
      description: string;
      karmaType: string;
      positive: string;
      negative: string;
      amount: string;
      amountPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      messageRequired: string;
      cancel: string;
      submit: string;
      success: string;
    };
    errors: {
      grantKarmaFailed: string;
      invalidAmount: string;
    };
  };
}

export function GiveKarmaDialog({
  isOpen,
  onClose,
  member,
  familyId,
  dict,
}: GiveKarmaDialogProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectOperationLoading("grantKarma"));
  const error = useAppSelector(selectOperationError("grantKarma"));

  const [karmaType, setKarmaType] = useState<"positive" | "negative">(
    "positive",
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setKarmaType("positive");
    setAmount("");
    setDescription("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!member) return;

    const numAmount = Number.parseInt(amount, 10);
    if (Number.isNaN(numAmount) || numAmount <= 0 || numAmount > 100000) {
      toast.error(dict.errors.invalidAmount);
      return;
    }

    if (!description.trim()) {
      toast.error(dict.giveKarmaDialog.messageRequired);
      return;
    }

    if (description.length > 500) {
      toast.error("Message must be 500 characters or less");
      return;
    }

    const finalAmount = karmaType === "positive" ? numAmount : -numAmount;

    try {
      await dispatch(
        grantMemberKarma({
          familyId,
          userId: member.memberId,
          amount: finalAmount,
          description: description.trim(),
        }),
      ).unwrap();

      toast.success(dict.giveKarmaDialog.success);
      handleClose();
    } catch (_err) {
      toast.error(dict.errors.grantKarmaFailed, {
        description: error || undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {dict.giveKarmaDialog.title.replace("{name}", member?.name || "")}
          </DialogTitle>
          <DialogDescription>
            {dict.giveKarmaDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{dict.giveKarmaDialog.karmaType}</Label>
            <RadioGroup
              value={karmaType}
              onValueChange={(value: "positive" | "negative") =>
                setKarmaType(value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="positive"
                  id="positive"
                  data-testid="karma-type-positive"
                />
                <Label
                  htmlFor="positive"
                  className="font-normal cursor-pointer"
                >
                  {dict.giveKarmaDialog.positive}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="negative"
                  id="negative"
                  data-testid="karma-type-negative"
                />
                <Label
                  htmlFor="negative"
                  className="font-normal cursor-pointer"
                >
                  {dict.giveKarmaDialog.negative}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="karma-amount">{dict.giveKarmaDialog.amount}</Label>
            <Input
              id="karma-amount"
              data-testid="karma-amount-input"
              type="number"
              min="1"
              max="100000"
              placeholder={dict.giveKarmaDialog.amountPlaceholder}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="karma-message">
              {dict.giveKarmaDialog.message} *
            </Label>
            <Textarea
              data-testid="karma-message-input"
              id="karma-message"
              placeholder={dict.giveKarmaDialog.messagePlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-testid="karma-cancel-button"
          >
            {dict.giveKarmaDialog.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !amount ||
              !description.trim() ||
              Number.parseInt(amount, 10) <= 0
            }
            data-testid="karma-submit-button"
          >
            {dict.giveKarmaDialog.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
