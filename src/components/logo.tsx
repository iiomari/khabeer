import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/ar";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none" strokeLinecap="round">
        <path d="M8 22c0-7 4.5-12 11-12" stroke="currentColor" strokeWidth="2.4" />
        <path
          d="M8 22c0-4.2 2.6-7.2 6.4-7.2"
          stroke="var(--color-accent)"
          strokeWidth="2.4"
          opacity="0.95"
        />
        <circle cx="22.5" cy="21.5" r="2.5" fill="var(--color-accent)" />
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
