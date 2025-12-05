import { Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Dictionary } from "@/i18n/types";
import type { CreateRewardRequest, Reward } from "@/types/api.types";

interface RewardDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  reward?: Reward;
  onSubmit: (data: CreateRewardRequest, imageFile?: File) => void;
  onClose: () => void;
  dict: Dictionary;
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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [name, setName] = useState("");
  const [karmaCost, setKarmaCost] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError(t.fields.image.errors.fileType);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t.fields.image.errors.fileSize);
      return;
    }

    // Clear any previous errors
    setUploadError(null);

    // Set the file and generate preview
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Clear URL input when file is selected
    setImageUrl("");
  };

  const handleRemoveFile = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateRewardRequest = {
      name,
      karmaCost: Number.parseInt(karmaCost, 10),
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    };

    onSubmit(data, selectedFile || undefined);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setKarmaCost("");
    setDescription("");
    setImageUrl("");
    setShowDescription(false);
    handleRemoveFile();
    onClose();
  };

  const header = (
    <>
      <DialogTitle>
        {mode === "create" ? t.create.title : t.edit.title}
      </DialogTitle>
      <DialogDescription>
        {mode === "create" ? t.create.description : t.edit.description}
      </DialogDescription>
    </>
  );

  const FormContent = (
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
        <Label>{t.fields.image.label}</Label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="reward-file-input"
        />

        {/* Upload button or preview */}
        {!imagePreview ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
              data-testid="reward-upload-button"
            >
              <Upload className="h-4 w-4" />
              {t.fields.image.uploadButton}
            </Button>

            {/* "or provide URL" label */}
            <div className="text-center text-sm text-muted-foreground">
              {t.fields.image.orLabel}
            </div>

            {/* URL input */}
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t.fields.image.urlPlaceholder}
              disabled={!!selectedFile}
              data-testid="reward-image-url-input"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Image preview */}
            <div className="relative inline-block">
              {/* biome-ignore lint/performance/noImgElement: Next/Image cannot display blob preview URLs without additional configuration */}
              <img
                src={imagePreview}
                alt={t.fields.image.preview || "Reward image preview"}
                className="max-h-48 rounded-md border"
                data-testid="reward-image-preview"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                onClick={handleRemoveFile}
                data-testid="reward-remove-image-button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <p
            className="text-sm text-destructive"
            data-testid="reward-upload-error"
          >
            {uploadError}
          </p>
        )}
      </div>

      {!showDescription ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowDescription(true)}
          data-testid="reward-description-toggle"
        >
          <Plus className="h-4 w-4" />
          {t.fields.description.addButton}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="description">{t.fields.description.label}</Label>
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
  );

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={handleClose}>
        {t.actions.cancel}
      </Button>
      <Button type="submit" data-testid="reward-dialog-submit">
        {mode === "create" ? t.actions.create : t.actions.update}
      </Button>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]" data-testid="reward-dialog">
          <form onSubmit={handleSubmit}>
            <DialogHeader>{header}</DialogHeader>
            {FormContent}
            <DialogFooter>{footer}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={isOpen} onOpenChange={handleClose} repositionInputs={false}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DrawerHeader className="text-left">{header}</DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
            {FormContent}
          </div>
          <DrawerFooter className="pt-2 flex-row gap-2">
            <Button
              type="submit"
              className="flex-1"
              data-testid="reward-dialog-submit"
            >
              {mode === "create" ? t.actions.create : t.actions.update}
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                {t.actions.cancel}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
