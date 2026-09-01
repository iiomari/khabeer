import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingList } from "@/components/dashboard/booking-list";
import { ExpertCard } from "@/components/expert-card";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatNumber, formatSar } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.nav.dashboard };

export default async function ClientOverviewPage() {
  const user = await requireRole("CLIENT");

  const [upcoming, activeCount, totalCount, spending, favorites] = await Promise.all([
    db.booking.findMany({
      where: { clientId: user.id, status: { in: ["PENDING", "CONFIRMED"] }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 4,
      include: {
        service: { select: { name: true } },
        expert: { select: { name: true, avatarUrl: true } },
      },
    }),
    db.booking.count({ where: { clientId: user.id, status: { in: ["PENDING", "CONFIRMED"] } } }),
    db.booking.count({ where: { clientId: user.id } }),
    db.payment.aggregate({
      where: { status: "PAID", booking: { clientId: user.id } },
      _sum: { amountSar: true },
    }),
    db.favorite.findMany({
      where: { clientId: user.id },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        expert: {
          select: {
            expertProfile: {
              select: {
                id: true,
                userId: true,
                headline: true,
                previousTitle: true,
                previousOrganization: true,
                yearsOfExperience: true,
                city: true,
                ratingAvg: true,
                ratingCount: true,
                completedConsultations: true,
                minPriceSar: true,
                verificationStatus: true,
                user: { select: { name: true, avatarUrl: true } },
                skills: { select: { id: true, name: true }, take: 4 },
                categories: { select: { category: { select: { name: true, slug: true } } }, take: 2 },
              },
            },
          },
        },
      },
    }),
  ]);

  const favoriteExperts = favorites
    .map((favorite) => favorite.expert.expertProfile)
    .filter((profile) => profile !== null);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.welcome(user.name)}</h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.myConsultations}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.dashboard.activeConsultations}
          value={formatNumber(activeCount)}
          icon="CalendarClock"
        />
        <StatCard
          label={t.dashboard.totalConsultations}
          value={formatNumber(totalCount)}
          icon="MessagesSquare"
          tone="accent"
        />
        <StatCard
          label={t.dashboard.totalSpending}
          value={formatSar(spending._sum.amountSar ?? 0)}
          icon="Wallet"
          tone="success"
        />
        <StatCard
          label={t.dashboard.favorites}
          value={formatNumber(favorites.length)}
          icon="Heart"
          tone="muted"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.dashboard.upcomingConsultations}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/client/consultations">{t.common.showMore}</Link>
          </Button>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={t.dashboard.noUpcoming}
            description={t.discovery.subtitle}
            action={
              <Button asChild>
                <Link href="/experts">
                  <Search className="size-4" />
                  {t.dashboard.browseExperts}
                </Link>
              </Button>
            }
          />
        ) : (
          <BookingList bookings={upcoming} perspective="client" />
        )}
      </section>

      {favoriteExperts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t.dashboard.favorites}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/client/favorites">{t.common.showMore}</Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </section>
      ) : (
        <Card className="gap-3 p-6 text-center">
          <h2 className="font-semibold">{t.dashboard.noFavorites}</h2>
          <div>
            <Button variant="outline" asChild>
              <Link href="/experts">{t.dashboard.browseExperts}</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
