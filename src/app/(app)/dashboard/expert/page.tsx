import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CalendarX2, Inbox, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingList } from "@/components/dashboard/booking-list";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { EmptyState } from "@/components/empty-state";
import { RatingStars } from "@/components/rating-stars";
import { UserAvatar } from "@/components/user-avatar";
import { getExpertDashboardData } from "@/server/expert-dashboard";
import { requireRole } from "@/server/session";
import { formatNumber, formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.nav.dashboard };

export default async function ExpertOverviewPage() {
  const user = await requireRole("EXPERT");
  const data = await getExpertDashboardData(user.id);

  const status = data.profile?.verificationStatus ?? "DRAFT";
  const needsOnboarding =
    status === "DRAFT" ||
    (data.profile?._count.services ?? 0) === 0 ||
    (data.profile?._count.availability ?? 0) === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.welcome(user.name)}</h1>
        <p className="mt-1 text-muted-foreground">{data.profile?.headline ?? t.expert.profile}</p>
      </header>

      {needsOnboarding ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>{t.expert.profileDraft}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{t.onboarding.subtitle}</span>
            <Button size="sm" asChild>
              <Link href="/expert/onboarding">{t.expert.completeProfile}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : status === "PENDING" ? (
        <Alert className="border-warning/40 bg-warning/10">
          <AlertCircle className="text-warning" />
          <AlertTitle>{t.expert.profileUnderReview}</AlertTitle>
          <AlertDescription>{t.onboarding.publishHint}</AlertDescription>
        </Alert>
      ) : status === "REJECTED" ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t.expert.profileRejected}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{data.profile?.rejectionReason ?? ""}</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/expert/onboarding">{t.expert.completeProfile}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.dashboard.totalEarnings}
          value={formatSar(data.totalEarnings)}
          icon="Wallet"
          tone="success"
        />
        <StatCard
          label={t.dashboard.totalConsultations}
          value={formatNumber(data.completedCount)}
          icon="MessagesSquare"
        />
        <StatCard
          label={t.dashboard.newRequests}
          value={formatNumber(data.requests.length)}
          icon="Inbox"
          tone="accent"
        />
        <StatCard
          label={t.dashboard.averageRating}
          value={
            data.profile && data.profile.ratingCount > 0
              ? `${data.profile.ratingAvg.toFixed(1)} / 5`
              : "—"
          }
          hint={
            data.profile
              ? `${formatNumber(data.profile.ratingCount)} ${t.expert.reviewsCount}`
              : undefined
          }
          icon="Star"
          tone="muted"
        />
      </div>

      <Card className="gap-4 p-6">
        <h2 className="font-bold">{t.dashboard.earningsChart}</h2>
        <EarningsChart data={data.monthly} />
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.dashboard.newRequests}</h2>
        {data.requests.length === 0 ? (
          <EmptyState icon={Inbox} title={t.dashboard.noRequests} />
        ) : (
          <BookingList bookings={data.requests} perspective="expert" />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.dashboard.upcomingConsultations}</h2>
        {data.upcoming.length === 0 ? (
          <EmptyState icon={CalendarX2} title={t.dashboard.noUpcoming} />
        ) : (
          <BookingList bookings={data.upcoming} perspective="expert" />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.reviews.latest}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/expert/reviews">{t.common.showMore}</Link>
          </Button>
        </div>

        {data.reviews.length === 0 ? (
          <EmptyState icon={Star} title={t.reviews.noReviewsYet} />
        ) : (
          <ul className="space-y-3">
            {data.reviews.map((review) => (
              <li key={review.id}>
                <Card className="gap-2 p-5">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={review.client.name}
                      src={review.client.avatarUrl}
                      className="size-10"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{review.client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(review.createdAt)}
                        </span>
                      </div>
                      <RatingStars rating={review.rating} showValue={false} className="mt-1" />
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
