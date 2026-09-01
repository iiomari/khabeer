import type { Metadata } from "next";
import Link from "next/link";
import { HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpertCard } from "@/components/expert-card";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.favorites };

export default async function ClientFavoritesPage() {
  const user = await requireRole("CLIENT");

  const favorites = await db.favorite.findMany({
    where: { clientId: user.id },
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
  });

  const experts = favorites
    .map((favorite) => favorite.expert.expertProfile)
    .filter((profile) => profile !== null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.favorites}</h1>
      </header>

      {experts.length === 0 ? (
        <EmptyState
          icon={HeartOff}
          title={t.dashboard.noFavorites}
          action={
            <Button asChild>
              <Link href="/experts">{t.dashboard.browseExperts}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      )}
    </div>
  );
}
