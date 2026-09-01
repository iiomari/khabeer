import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RatingStars } from "@/components/rating-stars";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { getExpertReviews } from "@/server/experts";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatNumber, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.reviews };

export default async function ExpertReviewsPage() {
  const user = await requireRole("EXPERT");

  const [{ reviews, distribution }, profile] = await Promise.all([
    getExpertReviews(user.id),
    db.expertProfile.findUnique({
      where: { userId: user.id },
      select: { ratingAvg: true, ratingCount: true },
    }),
  ]);

  const maxCount = Math.max(1, ...distribution.map((entry) => entry.count));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.reviews}</h1>
      </header>

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title={t.reviews.noReviewsYet} />
      ) : (
        <>
          <Card className="flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="text-center sm:w-44">
              <div className="text-4xl font-bold">{(profile?.ratingAvg ?? 0).toFixed(1)}</div>
              <RatingStars
                rating={profile?.ratingAvg ?? 0}
                showValue={false}
                className="mt-1 justify-center"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {formatNumber(profile?.ratingCount ?? 0)} {t.expert.reviewsCount}
              </p>
            </div>

            <div className="flex-1 space-y-1.5">
              {distribution.map((entry) => (
                <div key={entry.stars} className="flex items-center gap-3">
                  <span className="flex w-12 items-center justify-end gap-1 text-sm text-muted-foreground">
                    {entry.stars}
                    <Star className="size-3.5 fill-accent text-accent" />
                  </span>
                  <Progress value={(entry.count / maxCount) * 100} className="h-2 flex-1" />
                  <span className="w-8 text-sm text-muted-foreground">
                    {formatNumber(entry.count)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <ul className="space-y-3">
            {reviews.map((review) => (
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
                      <p className="mt-2 leading-relaxed text-muted-foreground">{review.comment}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.booking.service.name}
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
