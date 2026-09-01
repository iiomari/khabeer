import type { Metadata } from "next";
import { CalendarX2, Inbox } from "lucide-react";
import { BookingList } from "@/components/dashboard/booking-list";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.consultations };

type ExpertBooking = { status: string; scheduledAt: Date };

function groupBookings<T extends ExpertBooking>(bookings: T[]) {
  const now = Date.now();
  const requests = bookings.filter((booking) => booking.status === "PENDING");
  const upcoming = bookings.filter(
    (booking) => booking.status === "CONFIRMED" && booking.scheduledAt.getTime() >= now,
  );
  const handled = new Set([...requests, ...upcoming]);
  return { requests, upcoming, past: bookings.filter((booking) => !handled.has(booking)) };
}

export default async function ExpertConsultationsPage() {
  const user = await requireRole("EXPERT");

  const bookings = await db.booking.findMany({
    where: { expertId: user.id },
    orderBy: { scheduledAt: "desc" },
    include: {
      service: { select: { name: true } },
      client: { select: { name: true, avatarUrl: true } },
    },
  });

  const { requests, upcoming, past } = groupBookings(bookings);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.consultations}</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.booking.requests}</h2>
        {requests.length === 0 ? (
          <EmptyState icon={Inbox} title={t.dashboard.noRequests} />
        ) : (
          <BookingList bookings={requests} perspective="expert" />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.booking.upcoming}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarX2} title={t.dashboard.noUpcoming} />
        ) : (
          <BookingList bookings={upcoming} perspective="expert" />
        )}
      </section>

      {past.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">{t.booking.past}</h2>
          <BookingList bookings={past} perspective="expert" />
        </section>
      ) : null}
    </div>
  );
}
