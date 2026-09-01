import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const NAV_LINKS = [
  { href: "/", label: t.nav.home },
  { href: "/experts", label: t.nav.experts },
  { href: "/#how-it-works", label: t.nav.howItWorks },
  { href: "/#about", label: t.nav.about },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label={t.nav.menu} className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu
                name={user.name}
                email={user.email}
                role={user.role}
                avatarUrl={user.avatarUrl}
              />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">{t.nav.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">{t.nav.register}</Link>
              </Button>
            </div>
          )}
          <MobileNav isAuthenticated={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
