"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  SendHorizontal,
} from "lucide-react";
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
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  /** Sends a file with whatever is already typed as its caption. */
  async function upload(file: File) {
    if (uploading) return;
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.set("file", file);
    if (draft.trim()) form.set("body", draft.trim());

    try {
      const response = await fetch(`/api/conversations/${conversationId}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        setDraft("");
        await loadMessages();
      } else {
        setError(data.error ?? t.common.somethingWentWrong);
      }
    } catch {
      setError(t.common.somethingWentWrong);
    } finally {
      setUploading(false);
    }
  }

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
                  {message.attachmentUrl ? (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-opacity hover:opacity-80",
                        isMine ? "bg-primary-foreground/15" : "bg-background",
                      )}
                    >
                      {message.attachmentType?.startsWith("image/") ? (
                        <ImageIcon className="size-4 shrink-0" />
                      ) : (
                        <Paperclip className="size-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">{message.attachmentName}</span>
                      <Download className="size-3.5 shrink-0 opacity-70" />
                    </a>
                  ) : null}

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

      {error ? (
        <p className="border-t bg-destructive/10 px-3 py-2 text-center text-xs text-destructive" role="status">
          {error}
        </p>
      ) : null}

      <div className="flex items-end gap-2 border-t p-3">
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => fileRef.current?.click()}
          disabled={sending || uploading}
          aria-label={t.messages.attach}
          title={t.messages.attachmentHint}
        >
          {uploading ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <Paperclip className="size-4.5" />
          )}
        </Button>

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
