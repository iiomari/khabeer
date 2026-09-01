import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { t } from "@/lib/i18n/ar";
import "./globals.css";

// Self-hosted (OFL) so typography never depends on a network round-trip to Google.
const arabic = localFont({
  variable: "--font-arabic",
  display: "swap",
  fallback: ["Segoe UI", "Tahoma", "system-ui", "sans-serif"],
  src: [
    { path: "../fonts/plex-arabic-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/plex-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/plex-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/plex-arabic-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/plex-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/plex-arabic-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/plex-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/plex-arabic-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/plex-latin-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: {
    default: `${t.brand.name} | ${t.brand.tagline}`,
    template: `%s | ${t.brand.name}`,
  },
  description: t.brand.description,
  keywords: ["خبير", "استشارات", "متقاعدين", "خبرات", "استشارات مهنية", "السعودية"],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: t.brand.name,
    title: `${t.brand.name} | ${t.brand.tagline}`,
    description: t.brand.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${arabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
