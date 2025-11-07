import type { LucideIcon } from "lucide-react";
import { Gift } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface RewardImageProps {
  imageUrl?: string | null;
  name: string;
  className?: string;
  icon?: LucideIcon;
}

const DEFAULT_ICON_SIZE = "h-16 w-16";

export function RewardImage({
  imageUrl,
  name,
  className,
  icon: Icon = Gift,
}: RewardImageProps) {
  const [hasError, setHasError] = useState(false);
  const shouldShowFallback = !imageUrl || hasError;

  if (!shouldShowFallback) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("object-cover h-full w-full", className)}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
      role="img"
      aria-label={name}
    >
      <Icon className={cn(DEFAULT_ICON_SIZE, "opacity-70")} aria-hidden />
    </div>
  );
}
