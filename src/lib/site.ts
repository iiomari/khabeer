/**
 * Absolute base URL for links that leave the app (emails, calendar entries).
 * Vercel injects VERCEL_PROJECT_PRODUCTION_URL, so no manual config is needed
 * in production; the localhost fallback keeps development links clickable.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
