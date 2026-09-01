import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { getAdminStats } from "@/server/stats";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatNumber, formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.admin.title };

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");

  const [stats, pending, recentBookings] = await Promise.all([
    getAdminStats(),
    db.expertProfile.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: { user: { select: { name: true, avatarUrl: true, email: true } } },
    }),
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        service: { select: { name: true } },
        client: { select: { name: true } },
        expert: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.admin.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.admin.overview}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.admin.totalUsers} value={formatNumber(stats.users)} icon="Users" />
        <StatCard
          label={t.admin.totalExperts}
          value={formatNumber(stats.experts)}
          icon="BadgeCheck"
          tone="accent"
        />
        <StatCard
          label={t.admin.totalClients}
          value={formatNumber(stats.clients)}
          icon="Building2"
          tone="muted"
        />
        <StatCard
          label={t.admin.totalBookings}
          value={formatNumber(stats.bookings)}
          icon="CalendarDays"
        />
        <StatCard
          label={t.admin.completedConsultations}
          value={formatNumber(stats.completed)}
          icon="CircleCheck"
          tone="muted"
        />
        <StatCard
          label={t.admin.revenue}
          value={formatSar(stats.revenue)}
          icon="Wallet"
          tone="success"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {t.admin.pendingVerifications}
            {stats.pendingVerifications > 0 ? (
              <Badge className="ms-2">{formatNumber(stats.pendingVerifications)}</Badge>
            ) : null}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/experts">{t.common.showMore}</Link>
          </Button>
        </div>

        {pending.length === 0 ? (
          <EmptyState icon={BadgeCheck} title={t.admin.noPending} />
        ) : (
          <ul className="space-y-3">
            {pending.map((profile) => (
              <li key={profile.id}>
                <Card className="flex-row items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={profile.user.name} src={profile.user.avatarUrl} seed={profile.userId} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{profile.user.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{profile.headline}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/experts">{t.common.view}</Link>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.admin.bookings}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/bookings">{t.common.showMore}</Link>
          </Button>
        </div>

        <ul className="space-y-2">
          {recentBookings.map((booking) => (
            <li key={booking.id}>
              <Card className="gap-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{booking.service.name}</span>
                  <span className="font-semibold text-primary">{formatSar(booking.priceSar)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.client.name} ← {booking.expert.name} ·{" "}
                  {formatShortDate(booking.createdAt)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
