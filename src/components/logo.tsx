import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/ar";

/**
 * The letter خ, split into its two parts: the body ح carries the brand colour,
 * and the dot that makes it خ is drawn separately in bronze. The dot is the
 * brand's secondary element — it reappears in badges, bullets and loaders.
 *
 * The letter is an outline traced from Noto Kufi Arabic (SIL OFL), not live text,
 * so it renders identically everywhere and needs no font to be loaded.
 */
const KHA_BODY =
  "M21.75 44.00Q19.13 44.00 17.15 43.00Q15.16 42.00 14.06 40.19Q12.97 38.38 12.97 35.99Q12.97 33.95 13.78 32.26Q14.58 30.56 16.16 29.17Q17.24 28.25 18.69 27.42Q20.13 26.59 22.17 25.81Q24.21 25.02 26.98 24.25Q26.71 23.36 26.48 22.57Q26.25 21.78 26.06 21.13Q25.48 18.85 24.23 17.74Q22.98 16.62 20.90 16.62Q19.67 16.62 18.22 17.06Q16.78 17.51 15.16 18.39L13.12 14.16Q14.97 13.16 17.40 12.58Q19.82 12.00 22.09 12.00Q25.94 12.00 28.18 13.83Q30.41 15.66 31.03 19.43Q31.45 21.86 31.97 23.38Q32.49 24.90 33.24 25.88Q33.99 26.86 35.03 27.67L32.11 31.45Q31.14 30.68 30.37 29.87Q29.60 29.06 28.99 28.21Q27.45 28.60 26.19 28.98Q24.94 29.37 24.02 29.69Q23.10 30.02 22.48 30.33Q20.59 31.29 19.59 32.60Q18.59 33.91 18.59 35.68Q18.59 37.30 19.80 38.30Q21.02 39.30 22.90 39.30Q24.21 39.30 25.62 39.09Q27.02 38.88 28.56 38.49L29.22 42.69Q27.99 43.11 26.73 43.42Q25.48 43.73 24.25 43.87Q23.02 44.00 21.75 44.00Z";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0", className)} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="size-10" role="presentation">
        <path d={KHA_BODY} fill="var(--color-primary)" />
        <circle cx="24" cy="6.2" r="3.2" fill="var(--color-accent)" />
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
