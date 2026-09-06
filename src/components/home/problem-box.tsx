"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzeProblemAction } from "@/server/actions/match";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

const STAGES = [t.match.stepReading, t.match.stepClassifying, t.match.stepMatching];

/** Paces the three labels across a typical analysis so the wait reads as work, not lag. */
const STAGE_DELAYS_MS = [0, 900, 2100];

export function ProblemBox() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setStage(0);

    const timers = STAGE_DELAYS_MS.slice(1).map((delay, index) =>
      setTimeout(() => setStage(index + 1), delay),
    );

    startTransition(async () => {
      const result = await analyzeProblemAction({ text });
      timers.forEach(clearTimeout);

      if (result.ok) {
        router.push(`/match/${result.requestId}`);
      } else {
        setStage(-1);
        setError(result.error);
      }
    });
  }

  if (pending) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8" aria-live="polite" aria-busy="true">
        <ol className="space-y-4">
          {STAGES.map((label, index) => {
            const done = index < stage;
            const active = index === stage;
            return (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 text-base transition-opacity duration-300",
                  done || active ? "opacity-100" : "opacity-40",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary text-primary",
                  )}
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </span>
                <span className={cn(active && "font-medium")}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-2 shadow-sm">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.match.placeholder}
          rows={5}
          maxLength={1500}
          aria-label={t.match.boxTitle}
          className="min-h-32 resize-none border-0 bg-transparent text-base leading-relaxed shadow-none focus-visible:ring-0"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
          <span className="text-xs text-muted-foreground">{t.match.charCount(text.trim().length)}</span>
          <Button size="lg" className="h-12 px-6 text-base" onClick={submit} disabled={text.trim().length < 20}>
            <Sparkles className="size-4.5" />
            {t.match.submit}
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t.match.tryExample}</span>
        {t.match.examples.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => {
              setText(example.text);
              setError(null);
            }}
            className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-brand-soft/60"
          >
            {example.label}
          </button>
        ))}
      </div>

      <Link
        href="/experts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {t.match.browseInstead}
        <ArrowLeft className="size-4" />
      </Link>
    </div>
  );
}
