import Link from "next/link";
import { BadgeCheck, Briefcase, MapPin, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";
import { currentBadge } from "@/lib/rewards";
import { t } from "@/lib/i18n/ar";
import { formatNumber, formatSar, formatYears } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ExpertCardData = {
  id: string;
  userId: string;
  headline: string | null;
  previousTitle: string | null;
  previousOrganization: string | null;
  yearsOfExperience: number;
  city: string | null;
  ratingAvg: number;
  ratingCount: number;
  completedConsultations: number;
  minPriceSar: number | null;
  verificationStatus: string;
  user: { name: string; avatarUrl: string | null };
  skills: { id: string; name: string }[];
  categories: { category: { name: string; slug: string } }[];
};

export function ExpertCard({ expert }: { expert: ExpertCardData }) {
  const profileHref = `/experts/${expert.userId}`;

  return (
    <Card className="card-hover flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={expert.user.name}
          src={expert.user.avatarUrl}
          seed={expert.userId}
          className="size-14"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base leading-snug font-semibold">
              <Link href={profileHref} className="hover:underline">
                {expert.user.name}
              </Link>
            </h3>
            {expert.verificationStatus === "VERIFIED" ? (
              <BadgeCheck
                className="size-4.5 shrink-0 text-primary"
                aria-label={t.expert.verified}
              />
            ) : null}
          </div>

          {/* The badge is derived from completed consultations, so it is evidence
              of delivered work rather than a self-declared claim. */}
          {(() => {
            const badge = currentBadge(expert.completedConsultations);
            if (!badge) return null;
            return (
              <Badge
                className={cn("mt-1.5 gap-1 border px-2 py-0.5 text-xs font-normal", badge.tone)}
                title={badge.description}
              >
                <Medal className="size-3" />
                {badge.name}
              </Badge>
            );
          })()}
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {expert.headline ?? expert.previousTitle}
          </p>
        </div>
      </div>

      <dl className="space-y-1.5 text-sm">
        {expert.previousOrganization ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">{t.expert.previousOrganization}</dt>
            <dd className="truncate">{expert.previousOrganization}</dd>
          </div>
        ) : null}
        {expert.city ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dt className="sr-only">{t.expert.location}</dt>
            <dd>{expert.city}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {expert.categories.map(({ category }) => (
          <Badge key={category.slug} variant="secondary" className="font-medium">
            {category.name}
          </Badge>
        ))}
        {expert.skills.slice(0, 3).map((skill) => (
          <Badge key={skill.id} variant="outline" className="font-normal text-muted-foreground">
            {skill.name}
          </Badge>
        ))}
      </div>

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <RatingStars rating={expert.ratingAvg} count={expert.ratingCount} />
          <span className="text-sm text-muted-foreground">
            {formatNumber(expert.completedConsultations)} {t.expert.consultations}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="text-muted-foreground">{t.expert.yearsOfExperience}: </span>
            <span className="font-semibold">{formatYears(expert.yearsOfExperience)}</span>
          </div>
          {expert.minPriceSar ? (
            <div className="text-sm">
              <span className="text-muted-foreground">{t.expert.startingFrom} </span>
              <span className="font-bold text-primary">{formatSar(expert.minPriceSar)}</span>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={profileHref}>{t.expert.viewProfile}</Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href={`${profileHref}#services`}>{t.expert.bookConsultation}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
