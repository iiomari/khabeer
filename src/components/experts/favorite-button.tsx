"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/server/actions/favorites";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  expertId,
  initialIsFavorite,
  className,
}: {
  expertId: string;
  initialIsFavorite: boolean;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(expertId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setIsFavorite(result.isFavorite);
      toast.success(
        result.isFavorite ? t.expert.addedToFavorites : t.expert.removedFromFavorites,
      );
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isFavorite}
      className={cn("gap-2", className)}
    >
      <Heart className={cn("size-4.5", isFavorite && "fill-destructive text-destructive")} />
      {isFavorite ? t.expert.removeFromFavorites : t.expert.addToFavorites}
    </Button>
  );
}
