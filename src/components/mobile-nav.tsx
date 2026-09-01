"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { t } from "@/lib/i18n/ar";

const LINKS = [
  { href: "/", label: t.nav.home },
  { href: "/experts", label: t.nav.experts },
  { href: "/#how-it-works", label: t.nav.howItWorks },
  { href: "/#about", label: t.nav.about },
];

export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="size-11 lg:hidden" aria-label={t.nav.menu}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{t.nav.menu}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {!isAuthenticated ? (
          <div className="mt-4 flex flex-col gap-2 px-4">
            <Button variant="outline" size="lg" asChild onClick={() => setOpen(false)}>
              <Link href="/auth/login">{t.nav.login}</Link>
            </Button>
            <Button size="lg" asChild onClick={() => setOpen(false)}>
              <Link href="/auth/register">{t.nav.register}</Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
