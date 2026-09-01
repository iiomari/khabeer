import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { t } from "@/lib/i18n/ar";

export default function NotFound() {
  return (
    <div className="hero-grid flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-primary">
        <Compass className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t.common.notFound}</h1>
        <p className="text-muted-foreground">
          الرابط الذي فتحته غير موجود أو تم نقله.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/">{t.common.backHome}</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/experts">{t.nav.experts}</Link>
        </Button>
      </div>
    </div>
  );
}
