"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

/**
 * Polling transport keeps the MVP infrastructure-free; swapping in a realtime
 * provider means replacing loadMessages/send with socket handlers.
 */
const POLL_INTERVAL_MS = 5000;

export function ChatPanel({
  conversationId,
  currentUserId,
  counterpartName,
  className,
}: {
  conversationId: string;
  currentUserId: string;
  counterpartName: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { messages: ChatMessage[] };
      setMessages(data.messages);
    } catch {
      setMessages((current) => current ?? []);
    }
  }, [conversationId]);

  useEffect(() => {
    // Subscribing to an external source: state is only written inside the async callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages();
    const interval = setInterval(() => void loadMessages(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setDraft("");
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (response.ok) await loadMessages();
      else setDraft(body);
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex h-[28rem] flex-col rounded-xl border bg-card", className)}>
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{counterpartName}</h2>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages === null ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="ms-auto h-14 w-1/2" />
            <Skeleton className="h-14 w-3/5" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="font-medium">{t.messages.noMessages}</p>
            <p className="text-sm text-muted-foreground">{t.messages.startConversation}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={cn("flex", isMine ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isMine
                      ? "rounded-ss-sm bg-primary text-primary-foreground"
                      : "rounded-se-sm bg-muted",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.body}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[0.7rem]",
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    <span className="opacity-70">· {formatShortDate(message.createdAt)}</span>
                    {isMine ? (
                      message.readAt ? (
                        <CheckCheck className="size-3.5" aria-label={t.messages.read} />
                      ) : (
                        <Check className="size-3.5" aria-label={t.messages.delivered} />
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder={t.messages.placeholder}
          aria-label={t.messages.placeholder}
          rows={1}
          className="max-h-32 min-h-11 resize-none"
        />
        <Button
          type="button"
          size="icon"
          className="size-11 shrink-0"
          onClick={send}
          disabled={sending || draft.trim().length === 0}
          aria-label={t.messages.send}
        >
          {sending ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <SendHorizontal className="size-4.5 rtl:-scale-x-100" />
          )}
        </Button>
      </div>
    </div>
  );
}
