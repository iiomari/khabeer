import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingList } from "@/components/dashboard/booking-list";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.appointments };

export default async function ClientAppointmentsPage() {
  const user = await requireRole("CLIENT");

  const bookings = await db.booking.findMany({
    where: {
      clientId: user.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      service: { select: { name: true } },
      expert: { select: { name: true, avatarUrl: true } },
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
        <EmptyState
          icon={CalendarX2}
          title={t.dashboard.noUpcoming}
          action={
            <Button asChild>
              <Link href="/experts">{t.dashboard.browseExperts}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, items]) => (
            <Card key={day} className="gap-4 p-5">
              <h2 className="font-semibold text-primary">{day}</h2>
              <BookingList bookings={items} perspective="client" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
