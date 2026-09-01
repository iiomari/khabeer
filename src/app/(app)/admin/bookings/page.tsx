import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { resolveBookingStatus, STATUS_STYLES } from "@/lib/booking-status";
import { formatDateTime, formatNumber, formatSar } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: t.admin.bookings };

export default async function AdminBookingsPage() {
  await requireRole("ADMIN");

  const [bookings, paidTotal] = await Promise.all([
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        service: { select: { name: true } },
        client: { select: { name: true } },
        expert: { select: { name: true } },
        payment: { select: { status: true, method: true } },
      },
    }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amountSar: true } }),
  ]);

  const completed = bookings.filter(
    (booking) => resolveBookingStatus(booking) === "COMPLETED",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.admin.bookings}</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.admin.totalBookings}
          value={formatNumber(bookings.length)}
          icon="CalendarDays"
        />
        <StatCard
          label={t.admin.completedConsultations}
          value={formatNumber(completed)}
          icon="CircleCheck"
          tone="muted"
        />
        <StatCard
          label={t.admin.revenue}
          value={formatSar(paidTotal._sum.amountSar ?? 0)}
          icon="Wallet"
          tone="success"
        />
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.booking.bookingRef}</TableHead>
                <TableHead>{t.booking.selectService}</TableHead>
                <TableHead>{t.booking.client}</TableHead>
                <TableHead>{t.booking.expert}</TableHead>
                <TableHead>{t.booking.dateTime}</TableHead>
                <TableHead>{t.booking.price}</TableHead>
                <TableHead>{t.booking.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const status = resolveBookingStatus(booking);
                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${booking.id}`}
                        dir="ltr"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {booking.bookingRef}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{booking.service.name}</TableCell>
                    <TableCell>{booking.client.name}</TableCell>
                    <TableCell>{booking.expert.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(booking.scheduledAt)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatSar(booking.priceSar)}</TableCell>
                    <TableCell>
                      <Badge className={cn("border", STATUS_STYLES[status])}>
                        {t.booking.statuses[status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
