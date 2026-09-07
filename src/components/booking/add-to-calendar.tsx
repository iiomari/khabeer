"use client";

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { googleCalendarUrl, icsFile } from "@/lib/calendar";
import { t } from "@/lib/i18n/ar";

/**
 * Two routes into a calendar, because there is no single one that works for
 * everybody: Google takes a URL, while Apple Calendar and Outlook take a file.
 */
export function AddToCalendar({
  title,
  description,
  startsAt,
  durationMinutes,
  bookingRef,
  location,
}: {
  title: string;
  description: string;
  /** ISO string — the server component cannot hand a Date to a client component. */
  startsAt: string;
  durationMinutes: number;
  bookingRef: string;
  location?: string;
}) {
  const [saved, setSaved] = useState(false);
  const event = { title, description, startsAt: new Date(startsAt), durationMinutes, location };

  function downloadIcs() {
    const blob = new Blob([icsFile(event, bookingRef)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `khabeer-${bookingRef}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="size-4" />
          {t.booking.addToGoogle}
        </a>
      </Button>

      <Button variant="outline" size="sm" onClick={downloadIcs}>
        {saved ? <Check className="size-4" /> : <CalendarPlus className="size-4" />}
        {saved ? t.booking.calendarSaved : t.booking.addToApple}
      </Button>
    </div>
  );
}
