import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.payments };

const METHOD_LABELS: Record<string, string> = {
  MADA: t.payment.mada,
  APPLE_PAY: t.payment.applePay,
  CARD: t.payment.card,
};

export default async function ClientPaymentsPage() {
  const user = await requireRole("CLIENT");

  const payments = await db.payment.findMany({
    where: { booking: { clientId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingRef: true,
          service: { select: { name: true } },
          expert: { select: { name: true } },
        },
      },
    },
  });

  const total = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amountSar, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.payments}</h1>
        <p className="text-sm text-muted-foreground">
          {t.dashboard.totalSpending}: <span className="font-bold text-primary">{formatSar(total)}</span>
        </p>
      </header>

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
                  <TableHead>{t.booking.expert}</TableHead>
                  <TableHead>{t.payment.method}</TableHead>
                  <TableHead>{t.payment.amount}</TableHead>
                  <TableHead>{t.payment.paidAt}</TableHead>
                  <TableHead>{t.booking.status}</TableHead>
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
                    <TableCell className="max-w-56 truncate">{payment.booking.service.name}</TableCell>
                    <TableCell>{payment.booking.expert.name}</TableCell>
                    <TableCell>
                      {METHOD_LABELS[payment.method] ?? payment.method}
                      {payment.cardLast4 ? ` •••• ${payment.cardLast4}` : ""}
                    </TableCell>
                    <TableCell className="font-semibold">{formatSar(payment.amountSar)}</TableCell>
                    <TableCell>{formatShortDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "PAID" ? "secondary" : "outline"}>
                        {payment.status === "PAID" ? "مدفوعة" : "مستردة"}
                      </Badge>
                    </TableCell>
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
