import type { Metadata } from "next";
import { CalendarX2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BookingList } from "@/components/dashboard/booking-list";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.appointments };

export default async function ExpertAppointmentsPage() {
  const user = await requireRole("EXPERT");

  const bookings = await db.booking.findMany({
    where: {
      expertId: user.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      service: { select: { name: true } },
      client: { select: { name: true, avatarUrl: true } },
    },
  });

  const grouped = bookings.reduce<Record<string, typeof bookings>>((accumulator, booking) => {
    const key = formatDate(booking.scheduledAt);
    accumulator[key] = [...(accumulator[key] ?? []), booking];
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.appointments}</h1>
      </header>

      {bookings.length === 0 ? (
        <EmptyState icon={CalendarX2} title={t.dashboard.noUpcoming} />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <Card key={day} className="gap-4 p-5">
              <h2 className="font-semibold text-primary">{day}</h2>
              <BookingList bookings={items} perspective="expert" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
