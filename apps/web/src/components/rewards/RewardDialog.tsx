import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { CreateRewardRequest, Reward } from "@/types/api.types";

interface RewardDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  reward?: Reward;
  onSubmit: (data: CreateRewardRequest) => void;
  onClose: () => void;
  dict: any;
}

export function RewardDialog({
  isOpen,
  mode,
  reward,
  onSubmit,
  onClose,
  dict,
}: RewardDialogProps) {
  const t = dict.dashboard.pages.rewards.dialog;
  const [name, setName] = useState("");
  const [karmaCost, setKarmaCost] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showDescription, setShowDescription] = useState(false);

  // Sync form state when reward changes (for edit mode)
  useEffect(() => {
    if (reward) {
      setName(reward.name || "");
      setKarmaCost(reward.karmaCost?.toString() || "");
      setDescription(reward.description || "");
      setImageUrl(reward.imageUrl || "");
      setShowDescription(!!reward.description);
    } else {
      // Reset for create mode
      setName("");
      setKarmaCost("");
      setDescription("");
      setImageUrl("");
      setShowDescription(false);
    }
  }, [reward]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateRewardRequest = {
      name,
      karmaCost: Number.parseInt(karmaCost, 10),
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    };

    onSubmit(data);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setKarmaCost("");
    setDescription("");
    setImageUrl("");
    setShowDescription(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="reward-dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? t.create.title : t.edit.title}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" ? t.create.description : t.edit.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.fields.name.label} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.fields.name.placeholder}
                required
                maxLength={100}
                data-testid="reward-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="karmaCost">{t.fields.karmaCost.label} *</Label>
              <Input
                id="karmaCost"
                type="number"
                min="1"
                value={karmaCost}
                onChange={(e) => setKarmaCost(e.target.value)}
                placeholder={t.fields.karmaCost.placeholder}
                required
                data-testid="reward-karma-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t.fields.imageUrl.label}</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder={t.fields.imageUrl.placeholder}
                data-testid="reward-image-input"
              />
              <p className="text-xs text-muted-foreground">
                {t.fields.imageUrl.help}
              </p>
            </div>

            {!showDescription ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowDescription(true)}
              >
                <Plus className="h-4 w-4" />
                {t.fields.description.addButton}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t.fields.description.label}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.fields.description.placeholder}
                  rows={3}
                  maxLength={500}
                  data-testid="reward-description-input"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t.actions.cancel}
            </Button>
            <Button type="submit" data-testid="reward-dialog-submit">
              {mode === "create" ? t.actions.create : t.actions.update}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
