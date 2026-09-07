"use client";

import { useEffect, useState } from "react";
import { Loader2, Maximize2, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

/**
 * The consultation happens inside the platform rather than on a link the two
 * sides swap in chat. The room is a Jitsi instance embedded in an iframe: no
 * account, no download, no API key, and the room name is derived from the
 * booking reference so only the two people holding that reference can guess it.
 */
export function MeetingRoom({
  bookingRef,
  displayName,
  durationMinutes,
  startsAt,
}: {
  bookingRef: string;
  displayName: string;
  durationMinutes: number;
  /** ISO string; the room opens 10 minutes before the appointment. */
  startsAt: string;
}) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const room = `khabeer-${bookingRef.toLowerCase()}`;
  const params = new URLSearchParams({
    "userInfo.displayName": displayName,
    "config.prejoinPageEnabled": "false",
    "config.disableDeepLinking": "true",
    "interfaceConfig.DEFAULT_BACKGROUND": "#16233a",
    lang: "ar",
  });
  const src = `https://meet.jit.si/${room}#${params.toString().replace(/&/g, "&")}`;

  // Reading the clock during render is impure, and a one-off read would also leave
  // the gate stale on an open tab. A timer flips it exactly when the room opens.
  const [tooEarly, setTooEarly] = useState(false);

  useEffect(() => {
    const opensAt = new Date(startsAt).getTime() - 10 * 60_000;
    const check = () => setTooEarly(Date.now() < opensAt);
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [startsAt]);

  if (!joined) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-primary">
          <Video className="size-6" />
        </span>
        <div>
          <h3 className="font-semibold">{t.meeting.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.meeting.hint} · {t.meeting.duration}: {formatMinutes(durationMinutes)}
          </p>
        </div>

        {tooEarly ? (
          <p className="text-sm text-muted-foreground">{t.meeting.notYet}</p>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              setLoading(true);
              setJoined(true);
            }}
          >
            <Video className="size-4.5" />
            {t.meeting.join}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">{t.meeting.privacy}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-white">
            <span className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t.meeting.connecting}
            </span>
          </div>
        ) : null}

        <iframe
          src={src}
          title={t.meeting.title}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="size-full"
          onLoad={() => setLoading(false)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setJoined(false)}>
          <VideoOff className="size-4" />
          {t.meeting.leave}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={src} target="_blank" rel="noopener noreferrer">
            <Maximize2 className="size-4" />
            {t.meeting.openInTab}
          </a>
        </Button>
      </div>
    </div>
  );
}
