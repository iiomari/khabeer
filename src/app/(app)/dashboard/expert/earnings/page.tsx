import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
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
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { getExpertDashboardData } from "@/server/expert-dashboard";
import { requireRole } from "@/server/session";
import { formatNumber, formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.earnings };

export default async function ExpertEarningsPage() {
  const user = await requireRole("EXPERT");

  const [data, payments] = await Promise.all([
    getExpertDashboardData(user.id),
    db.payment.findMany({
      where: { booking: { expertId: user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingRef: true,
            service: { select: { name: true } },
            client: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const thisMonth = data.monthly.at(-1)?.earnings ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.earnings}</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.dashboard.totalEarnings}
          value={formatSar(data.totalEarnings)}
          icon="Wallet"
          tone="success"
        />
        <StatCard label="أرباح هذا الشهر" value={formatSar(thisMonth)} icon="TrendingUp" />
        <StatCard
          label={t.dashboard.totalConsultations}
          value={formatNumber(data.completedCount)}
          icon="MessagesSquare"
          tone="muted"
        />
      </div>

      <Card className="gap-4 p-6">
        <h2 className="font-bold">{t.dashboard.earningsChart}</h2>
        <EarningsChart data={data.monthly} />
      </Card>

      {payments.length === 0 ? (
        <EmptyState icon={ReceiptText} title={t.dashboard.noPayments} />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.booking.bookingRef}</TableHead>
                  <TableHead>{t.booking.selectService}</TableHead>
                  <TableHead>{t.booking.client}</TableHead>
                  <TableHead>{t.payment.amount}</TableHead>
                  <TableHead>{t.payment.paidAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${payment.booking.id}`}
                        dir="ltr"
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {payment.booking.bookingRef}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-56 truncate">
                      {payment.booking.service.name}
                    </TableCell>
                    <TableCell>{payment.booking.client.name}</TableCell>
                    <TableCell className="font-semibold">
                      {formatSar(payment.amountSar)}
                      {payment.status === "REFUNDED" ? (
                        <span className="ms-2 text-xs text-muted-foreground">(مستردة)</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatShortDate(payment.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
