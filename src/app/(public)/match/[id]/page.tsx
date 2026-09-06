import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, SearchX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { BriefCard } from "@/components/match/brief-card";
import { MatchCard } from "@/components/match/match-card";
import { getMatchesForRequest } from "@/server/matching";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = {
  title: t.match.resultTitle,
  description: t.match.resultSubtitle,
};

async function getRequest(id: string) {
  return db.consultationRequest.findUnique({
    where: { id },
    include: { category: { select: { name: true, slug: true, icon: true } } },
  });
}

/**
 * Ranking runs in its own Suspense boundary so the brief — already computed and
 * stored — paints immediately while the shortlist is being explained.
 */
async function Matches({ requestId, categorySlug }: { requestId: string; categorySlug?: string }) {
  const matches = await getMatchesForRequest(requestId);

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t.match.emptyTitle}
        description={t.match.emptyBody}
        action={
          <Button asChild>
            <Link href="/experts">{t.discovery.title}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((expert, index) => (
        <div key={expert.id} className="fade-up" style={{ animationDelay: `${index * 90}ms` }}>
          <MatchCard expert={expert} requestId={requestId} rank={index + 1} />
        </div>
      ))}

      <Button variant="outline" className="w-full" asChild>
        <Link href={categorySlug ? `/experts?category=${categorySlug}` : "/experts"}>
          {t.match.seeMore}
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function MatchesSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-3 rounded-xl border p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default async function MatchPage({ params }: PageProps<"/match/[id]">) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={SearchX}
          title={t.match.notFound}
          description={t.match.notFoundBody}
          action={
            <Button asChild>
              <Link href="/">{t.match.startOver}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mb-7">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.match.pageTitle}</h1>
        <p className="mt-1.5 text-muted-foreground">{t.match.pageSubtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <BriefCard
            brief={{
              rawText: request.rawText,
              categoryName: request.category?.name ?? null,
              categoryIcon: request.category?.icon ?? null,
              reframedQuestion: request.reframedQuestion,
              keySkills: request.keySkills,
              questionsToAsk: request.questionsToAsk,
              suggestedMinutes: request.suggestedMinutes,
              budgetMinSar: request.budgetMinSar,
              budgetMaxSar: request.budgetMaxSar,
              engine: request.engine,
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">{t.match.matchesTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.match.matchesSubtitle}</p>
            </div>
          </div>

          <Suspense fallback={<MatchesSkeleton />}>
            <Matches requestId={id} categorySlug={request.category?.slug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
