import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/ar";

/**
 * Khabeer mark — التقاء: a wide ring (a long career) meeting a smaller one (the
 * organisation that needs it). The overlap is the consultation itself, which is
 * the whole product in one shape.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0", className)} aria-hidden="true">
      <svg viewBox="0 0 40 40" className="size-10" role="presentation">
        <circle
          cx="14.5"
          cy="20"
          r="10.5"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3.2"
        />
        <circle
          cx="25.5"
          cy="20"
          r="7.5"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3.2"
        />
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
