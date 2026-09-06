import Link from "next/link";
import { ArrowLeft, BadgeCheck, Lightbulb, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";
import { formatNumber, formatSar, formatYears } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import type { MatchedExpert } from "@/server/matching";

export function MatchCard({
  expert,
  requestId,
  rank,
}: {
  expert: MatchedExpert;
  requestId: string;
  rank: number;
}) {
  const role = [expert.previousTitle, expert.previousOrganization].filter(Boolean).join(" — ");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-start gap-4 p-5">
        <div className="relative shrink-0">
          <UserAvatar name={expert.name} src={expert.avatarUrl} seed={expert.id} className="size-14" />
          <span className="absolute -top-1 -start-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {formatNumber(rank)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{expert.name}</h3>
            <BadgeCheck className="size-4.5 shrink-0 text-primary" aria-label={t.expert.verified} />
          </div>

          {role ? <p className="mt-0.5 text-sm text-muted-foreground">{role}</p> : null}
          {expert.headline ? <p className="mt-1 text-sm">{expert.headline}</p> : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span>{formatYears(expert.yearsOfExperience)} خبرة</span>
            {expert.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {expert.city}
              </span>
            ) : null}
            {expert.ratingCount > 0 ? (
              <RatingStars rating={expert.ratingAvg} count={expert.ratingCount} size="sm" />
            ) : null}
          </div>
        </div>

        <div className="hidden shrink-0 text-end sm:block">
          <div className="text-xs text-muted-foreground">{t.match.matchScore}</div>
          <div className="text-2xl font-bold text-primary">{formatNumber(expert.score)}%</div>
          <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${expert.score}%` }} />
          </div>
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-xl bg-brand-soft/60 p-4">
        <h4 className="mb-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Lightbulb className="size-4" />
          {t.match.whyThisExpert}
        </h4>
        <p className="text-sm leading-relaxed">{expert.reason}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3.5">
        <span className="text-sm text-muted-foreground">
          {expert.minPriceSar !== null ? (
            <>
              {t.expert.startingFrom}{" "}
              <strong className="text-foreground">{formatSar(expert.minPriceSar)}</strong>
            </>
          ) : null}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/experts/${expert.id}`}>{t.match.viewProfile}</Link>
          </Button>
          <Button asChild>
            <Link href={`/booking/${expert.id}?request=${requestId}`}>
              {t.match.bookNow}
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
