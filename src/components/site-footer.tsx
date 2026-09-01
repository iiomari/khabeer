import Link from "next/link";
import { Logo } from "@/components/logo";
import { t } from "@/lib/i18n/ar";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{t.home.footerTagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <nav className="space-y-2" aria-label={t.nav.menu}>
            <h3 className="text-sm font-semibold">{t.brand.name}</h3>
            <Link href="/experts" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.nav.experts}
            </Link>
            <Link href="/#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.nav.howItWorks}
            </Link>
            <Link href="/#about" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.nav.about}
            </Link>
          </nav>

          <nav className="space-y-2" aria-label={t.auth.registerTitle}>
            <h3 className="text-sm font-semibold">{t.auth.registerTitle}</h3>
            <Link href="/auth/register?role=EXPERT" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.auth.roleExpert}
            </Link>
            <Link href="/auth/register?role=CLIENT" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.auth.roleClient}
            </Link>
            <Link href="/auth/login" className="block text-sm text-muted-foreground hover:text-foreground">
              {t.nav.login}
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t py-5">
        <p className="container-page text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t.brand.name} — {t.home.footerRights}
        </p>
      </div>
    </footer>
  );
}
