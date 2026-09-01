import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingList } from "@/components/dashboard/booking-list";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.myConsultations };

type ClientBooking = { status: string; scheduledAt: Date };

function splitByTime<T extends ClientBooking>(bookings: T[]) {
  const now = Date.now();
  const upcoming = bookings.filter(
    (booking) =>
      ["PENDING", "CONFIRMED"].includes(booking.status) && booking.scheduledAt.getTime() >= now,
  );
  const upcomingIds = new Set(upcoming);
  return { upcoming, past: bookings.filter((booking) => !upcomingIds.has(booking)) };
}

export default async function ClientConsultationsPage() {
  const user = await requireRole("CLIENT");

  const bookings = await db.booking.findMany({
    where: { clientId: user.id },
    orderBy: { scheduledAt: "desc" },
    include: {
      service: { select: { name: true } },
      expert: { select: { name: true, avatarUrl: true } },
    },
  });

  const { upcoming, past } = splitByTime(bookings);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.myConsultations}</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.booking.upcoming}</h2>
        {upcoming.length === 0 ? (
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
          <BookingList bookings={upcoming} perspective="client" />
        )}
      </section>

      {past.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">{t.booking.past}</h2>
          <BookingList bookings={past} perspective="client" />
        </section>
      ) : null}
    </div>
  );
}
