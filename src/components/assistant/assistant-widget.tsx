"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  MicOff,
  MessageCircleQuestion,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { askAssistantAction } from "@/server/actions/assistant";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/enums";

type Turn = {
  role: "user" | "assistant";
  content: string;
  href?: string;
  linkLabel?: string;
  engine?: "model" | "offline";
};

/** Minimal shape of the Web Speech API — it is absent from the DOM lib types. */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function createRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const SUGGESTIONS: Record<UserRole, readonly string[]> = {
  CLIENT: t.assistant.suggestionsClient,
  EXPERT: t.assistant.suggestionsExpert,
  ADMIN: t.assistant.suggestionsAdmin,
};

export function AssistantWidget({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  // Speech keeps running after the panel closes unless it is explicitly stopped.
  useEffect(() => {
    if (open) return;
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  }, [open]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;

    setNotice(null);
    setDraft("");
    const history = turns.map((turn) => ({ role: turn.role, content: turn.content }));
    setTurns((current) => [...current, { role: "user", content: text }]);

    startTransition(async () => {
      const result = await askAssistantAction({ question: text, history });
      if (result.ok) {
        setTurns((current) => [
          ...current,
          {
            role: "assistant",
            content: result.answer,
            href: result.href,
            linkLabel: result.linkLabel,
            engine: result.engine,
          },
        ]);
      } else {
        setNotice(result.error);
      }
    });
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createRecognition();
    if (!recognition) {
      setNotice(t.assistant.voiceUnsupported);
      return;
    }

    recognition.lang = "ar-SA";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) ask(transcript);
    };
    recognition.onerror = (event) => {
      setNotice(event.error === "not-allowed" ? t.assistant.micDenied : t.assistant.voiceUnsupported);
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setNotice(null);
    setListening(true);
    recognition.start();
  }

  function toggleSpeech(index: number, text: string) {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speakingIndex === index) {
      synth.cancel();
      setSpeakingIndex(null);
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    synth.speak(utterance);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.assistant.open}
        className="fixed bottom-5 start-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <MessageCircleQuestion className="size-6" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t.assistant.title}
      className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:start-5 sm:w-96"
    >
      <header className="flex items-center justify-between gap-2 border-b bg-brand-soft/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{t.assistant.title}</h2>
            <p className="truncate text-xs text-muted-foreground">{t.assistant.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {turns.length > 0 ? (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setTurns([])}>
              {t.assistant.newChat}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setOpen(false)}
            aria-label={t.assistant.close}
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {turns.length === 0 ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">{t.assistant.greeting}</p>
            <p className="text-xs font-semibold text-muted-foreground">{t.assistant.suggestionsTitle}</p>
            <ul className="space-y-2">
              {SUGGESTIONS[role].map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-start text-sm transition-colors hover:border-primary/50 hover:bg-brand-soft/60"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {turns.map((turn, index) => (
          <div
            key={`${turn.role}-${index}`}
            className={cn("flex", turn.role === "user" ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                turn.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <p className="whitespace-pre-line">{turn.content}</p>

              {turn.role === "assistant" ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSpeech(index, turn.content)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {speakingIndex === index ? (
                      <VolumeX className="size-3.5" />
                    ) : (
                      <Volume2 className="size-3.5" />
                    )}
                    {speakingIndex === index ? t.assistant.stopReading : t.assistant.readAloud}
                  </button>

                  {turn.href ? (
                    <Link
                      href={turn.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {turn.linkLabel}
                      <ArrowLeft className="size-3.5" />
                    </Link>
                  ) : null}

                  {turn.engine ? (
                    <Badge variant="secondary" className="ms-auto text-[10px] font-normal">
                      {turn.engine === "model" ? t.assistant.engineClaude : t.assistant.engineOffline}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="flex justify-end">
            <div className="rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              {t.assistant.thinking}
            </div>
          </div>
        ) : null}

        {listening ? (
          <p className="text-center text-xs font-medium text-primary" aria-live="polite">
            {t.assistant.listening}
          </p>
        ) : null}

        {notice ? (
          <p className="rounded-lg bg-destructive/10 p-2.5 text-center text-xs text-destructive" role="status">
            {notice}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <Button
          type="button"
          variant={listening ? "default" : "outline"}
          size="icon"
          className="size-10 shrink-0"
          onClick={toggleListening}
          aria-label={listening ? t.assistant.stopListening : t.assistant.speak}
          title={listening ? t.assistant.stopListening : t.assistant.speak}
        >
          {listening ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
        </Button>

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.assistant.placeholder}
          aria-label={t.assistant.placeholder}
          maxLength={500}
          className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-primary"
        />

        <Button
          type="submit"
          size="icon"
          className="size-10 shrink-0"
          disabled={pending || !draft.trim()}
          aria-label={t.assistant.send}
        >
          <Send className="size-4.5" />
        </Button>
      </form>

      <p className="border-t px-3 py-2 text-center text-[10px] text-muted-foreground">
        {t.assistant.demoNote}
      </p>
    </div>
  );
}
