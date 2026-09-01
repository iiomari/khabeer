import { db } from "@/lib/db";
import { BOOKING_WINDOW_DAYS, SLOT_STEP_MINUTES } from "@/lib/constants";

export type DaySlots = {
  /** yyyy-mm-dd in local time */
  dateKey: string;
  date: Date;
  slots: { startMinute: number; startsAt: Date }[];
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export async function getAvailableSlots(
  expertProfileId: string,
  expertUserId: string,
  durationMinutes: number,
): Promise<DaySlots[]> {
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + BOOKING_WINDOW_DAYS);

  const [availability, bookings] = await Promise.all([
    db.availabilitySlot.findMany({ where: { expertProfileId } }),
    db.booking.findMany({
      where: {
        expertId: expertUserId,
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { gte: now, lte: windowEnd },
      },
      select: { scheduledAt: true, durationMinutes: true },
    }),
  ]);

  if (availability.length === 0) return [];

  const busy = bookings.map((booking) => ({
    start: booking.scheduledAt.getTime(),
    end: booking.scheduledAt.getTime() + booking.durationMinutes * 60_000,
  }));

  const days: DaySlots[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    day.setHours(0, 0, 0, 0);

    const daySlots: DaySlots["slots"] = [];
    const patterns = availability.filter((slot) => slot.dayOfWeek === day.getDay());

    for (const pattern of patterns) {
      for (
        let minute = pattern.startMinute;
        minute + durationMinutes <= pattern.endMinute;
        minute += SLOT_STEP_MINUTES
      ) {
        const startsAt = new Date(day);
        startsAt.setMinutes(minute);

        if (startsAt.getTime() <= now.getTime() + 60 * 60_000) continue;

        const start = startsAt.getTime();
        const end = start + durationMinutes * 60_000;
        const overlaps = busy.some((slot) => start < slot.end && end > slot.start);
        if (overlaps) continue;

        daySlots.push({ startMinute: minute, startsAt });
      }
    }

    if (daySlots.length > 0) {
      daySlots.sort((a, b) => a.startMinute - b.startMinute);
      days.push({ dateKey: dateKey(day), date: day, slots: daySlots });
    }
  }

  return days;
}

export async function isSlotFree(expertUserId: string, startsAt: Date, durationMinutes: number) {
  const start = startsAt.getTime();
  const end = start + durationMinutes * 60_000;

  const conflicts = await db.booking.findMany({
    where: {
      expertId: expertUserId,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: {
        gte: new Date(start - 12 * 60 * 60_000),
        lte: new Date(end + 12 * 60 * 60_000),
      },
    },
    select: { scheduledAt: true, durationMinutes: true },
  });

  return !conflicts.some((booking) => {
    const bookingStart = booking.scheduledAt.getTime();
    const bookingEnd = bookingStart + booking.durationMinutes * 60_000;
    return start < bookingEnd && end > bookingStart;
  });
}
