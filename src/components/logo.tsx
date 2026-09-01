import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/ar";

/**
 * Khabeer mark: the letter خ in the brand typeface, centred inside an ink-navy
 * squircle framed by a bronze ring — the frame keeps its distance from the
 * glyph, so the mark stays clean from favicon size up.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0", className)} aria-hidden="true">
      <svg viewBox="0 0 40 40" className="size-10" role="presentation">
        <defs>
          <linearGradient id="khabeer-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="color-mix(in oklch, var(--color-primary) 75%, black)" />
          </linearGradient>
        </defs>

        <rect width="40" height="40" rx="11" fill="url(#khabeer-mark)" />

        <rect
          x="3.2"
          y="3.2"
          width="33.6"
          height="33.6"
          rx="8.6"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          opacity="0.9"
        />

        <text
          x="20"
          y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-primary-foreground)"
          fontSize="21"
          fontWeight="600"
          style={{ fontFamily: "var(--font-arabic), 'Segoe UI', Tahoma, sans-serif" }}
        >
          خ
        </text>
      </svg>
    </span>
  );
}

export function Logo({
  className,
  withTagline = false,
  href = "/",
}: {
  className?: string;
  withTagline?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label={`${t.brand.name} — ${t.brand.tagline}`}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-bold tracking-tight text-foreground">{t.brand.name}</span>
        {withTagline ? (
          <span className="mt-1 text-xs font-medium text-muted-foreground">{t.brand.tagline}</span>
        ) : null}
      </span>
    </Link>
  );
}
