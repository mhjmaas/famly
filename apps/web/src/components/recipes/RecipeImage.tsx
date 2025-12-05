import type { LucideIcon } from "lucide-react";
import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils/style-utils";

interface RecipeImageProps {
  imageUrl?: string | null;
  name: string;
  className?: string;
  icon?: LucideIcon;
}

const DEFAULT_ICON_SIZE = "h-16 w-16";

export function RecipeImage({
  imageUrl,
  name,
  className,
  icon: Icon = UtensilsCrossed,
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const shouldShowFallback = !imageUrl || hasError;

  if (shouldShowFallback) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={name}
        data-testid="recipe-image-fallback"
      >
        <Icon className={cn(DEFAULT_ICON_SIZE, "opacity-70")} aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <Image
        src={imageUrl}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px"
        onError={() => setHasError(true)}
        unoptimized={
          imageUrl.startsWith("blob:") || imageUrl.startsWith("/api/")
        }
        priority={false}
        data-testid="recipe-image"
      />
    </div>
  );
}
