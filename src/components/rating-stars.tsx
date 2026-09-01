import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

export function RatingStars({
  rating,
  count,
  size = "sm",
  showValue = true,
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const starSize = size === "lg" ? "size-5" : size === "md" ? "size-4.5" : "size-4";
  const rounded = Math.round(rating);

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`التقييم ${rating.toFixed(1)} من ٥${count !== undefined ? `، ${count} تقييم` : ""}`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              starSize,
              value <= rounded ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      {showValue ? (
        <span className="text-sm font-medium text-foreground">
          {rating > 0 ? rating.toFixed(1) : "—"}
        </span>
      ) : null}
      {count !== undefined ? (
        <span className="text-sm text-muted-foreground">({formatNumber(count)})</span>
      ) : null}
    </div>
  );
}
