"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/ar";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t.common.somethingWentWrong}</h1>
        <p className="text-muted-foreground">
          حدث خلل غير متوقع أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          {t.common.tryAgain}
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/">{t.common.backHome}</Link>
        </Button>
      </div>
    </div>
  );
}
