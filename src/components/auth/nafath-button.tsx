"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nafathDemoLoginAction } from "@/server/actions/auth";
import { t } from "@/lib/i18n/ar";

export function NafathButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function signIn() {
    setError(null);
    startTransition(async () => {
      const result = await nafathDemoLoginAction();
      if (result.ok) {
        toast.success(t.auth.nafathWelcome);
        router.push(result.redirectTo);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={signIn}
        disabled={pending}
        className="h-13 w-full justify-between gap-3 border-2 px-4 text-base hover:border-primary/40 hover:bg-brand-soft/50"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ScanFace className="size-5" />
            )}
          </span>
          <span className="font-semibold">
            {pending ? t.auth.nafathLoading : t.auth.nafath}
          </span>
        </span>
        <Badge variant="secondary" className="shrink-0 text-xs font-medium">
          {t.auth.nafathBadge}
        </Badge>
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">{t.auth.nafathHint}</p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3 pt-1">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.auth.or}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
