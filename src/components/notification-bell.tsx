"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { t } from "@/lib/i18n/ar";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { items: NotificationItem[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // Silent: the bell is non-critical chrome.
    }
  }, []);

  useEffect(() => {
    // Subscribing to an external source: state is only written inside the async callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(() => void load(), 20_000);
    return () => clearInterval(interval);
  }, [load]);

  async function markAllRead() {
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({}) });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-11"
          aria-label={`${t.notifications.title}${unread > 0 ? ` (${unread} ${t.notifications.new})` : ""}`}
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute end-1.5 top-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-bold text-white">
              {unread > 9 ? "٩+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">{t.notifications.title}</span>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={markAllRead}>
              <CheckCheck className="size-3.5" />
              {t.notifications.markAllRead}
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t.notifications.empty}
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.linkUrl ?? "#"}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-3 py-3 transition-colors hover:bg-muted/60",
                      !item.isRead && "bg-brand-soft/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{item.title}</span>
                      {!item.isRead ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                    <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
