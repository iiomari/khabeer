export type CalendarEvent = {
  title: string;
  description: string;
  startsAt: Date;
  durationMinutes: number;
  location?: string;
};

/** Calendar formats want UTC basic form: 20260907T101500Z */
function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endOf(event: CalendarEvent): Date {
  return new Date(event.startsAt.getTime() + event.durationMinutes * 60_000);
}

/** Google Calendar takes a plain link, which is the least friction on any device. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.startsAt)}/${stamp(endOf(event))}`,
    details: event.description,
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * RFC 5545 reserves four characters inside a text value. Split/join is used
 * instead of regular expressions so the escapes stay readable.
 */
function escapeIcsText(value: string): string {
  return value
    .split("\\")
    .join("\\\\")
    .split(";")
    .join("\\;")
    .split(",")
    .join("\\,")
    .split("\n")
    .join("\\n");
}

/**
 * Apple Calendar and Outlook have no URL scheme, so they take an .ics file.
 * Lines are CRLF-terminated, as the spec requires.
 */
export function icsFile(event: CalendarEvent, uid: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Khabeer//Consultation//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@khabeer.sa`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(endOf(event))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:تذكير باستشارة خبير",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
