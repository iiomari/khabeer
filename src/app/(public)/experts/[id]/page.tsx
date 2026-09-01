import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  GraduationCap,
  MapPin,
  MessageSquareQuote,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/experts/favorite-button";
import { getExpertProfile, getExpertReviews } from "@/server/experts";
import { getCurrentUser } from "@/server/session";
import { db } from "@/lib/db";
import { WEEK_DAYS } from "@/lib/constants";
import { formatMinutes, formatNumber, formatSar, formatShortDate, formatYears, minutesToTimeLabel } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export async function generateMetadata({ params }: PageProps<"/experts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const expert = await getExpertProfile(id);
  if (!expert) return { title: t.common.notFound };

  return {
    title: `${expert.user.name} — ${expert.headline ?? t.expert.profile}`,
    description: expert.bio?.slice(0, 160) ?? t.brand.description,
    openGraph: {
      title: `${expert.user.name} | ${t.brand.name}`,
      description: expert.headline ?? t.brand.description,
    },
  };
}

export default async function ExpertProfilePage({ params }: PageProps<"/experts/[id]">) {
  const { id } = await params;
  const expert = await getExpertProfile(id);

  if (!expert || expert.verificationStatus !== "VERIFIED" || expert.user.status !== "ACTIVE") {
    notFound();
  }

  const [{ reviews, distribution }, currentUser] = await Promise.all([
    getExpertReviews(expert.userId),
    getCurrentUser(),
  ]);

  const isFavorite = currentUser
    ? Boolean(
        await db.favorite.findUnique({
          where: { clientId_expertId: { clientId: currentUser.id, expertId: expert.userId } },
        }),
      )
    : false;

  const maxDistribution = Math.max(1, ...distribution.map((entry) => entry.count));
  const startingPrice = expert.services.length
    ? Math.min(...expert.services.map((service) => service.priceSar))
    : null;

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="gap-5 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <UserAvatar
                name={expert.user.name}
                src={expert.user.avatarUrl}
                seed={expert.userId}
                className="size-24 text-2xl"
              />

              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">{expert.user.name}</h1>
                  <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                    <BadgeCheck className="size-3.5" />
                    {t.expert.verified}
                  </Badge>
                </div>

                <p className="text-base text-muted-foreground">{expert.headline}</p>

                <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {expert.previousOrganization ? (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="size-4" />
                      <dt className="sr-only">{t.expert.previousOrganization}</dt>
                      <dd>
                        {expert.previousTitle} — {expert.previousOrganization}
                      </dd>
                    </div>
                  ) : null}
                  {expert.city ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      <dt className="sr-only">{t.expert.location}</dt>
                      <dd>{expert.city}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    <dt className="sr-only">{t.expert.yearsOfExperience}</dt>
                    <dd>{formatYears(expert.yearsOfExperience)}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <RatingStars rating={expert.ratingAvg} count={expert.ratingCount} size="md" />
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(expert.completedConsultations)} {t.expert.consultations}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {expert.categories.map(({ category }) => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>

            {currentUser?.role === "CLIENT" ? (
              <FavoriteButton
                expertId={expert.userId}
                initialIsFavorite={isFavorite}
                className="w-full sm:w-auto"
              />
            ) : null}
          </Card>

          {expert.bio ? (
            <Card className="gap-3 p-6">
              <h2 className="text-lg font-bold">{t.expert.bio}</h2>
              <p className="leading-loose whitespace-pre-line text-muted-foreground">{expert.bio}</p>
            </Card>
          ) : null}

          {expert.experiences.length > 0 ? (
            <Card className="gap-4 p-6">
              <h2 className="text-lg font-bold">{t.expert.experiences}</h2>
              <ol className="space-y-5">
                {expert.experiences.map((experience) => (
                  <li key={experience.id} className="relative ps-6">
                    <span className="absolute start-0 top-1.5 size-2.5 rounded-full bg-primary" />
                    <span className="absolute start-[4px] top-5 h-[calc(100%-0.5rem)] w-px bg-border last:hidden" />
                    <h3 className="font-semibold">{experience.position}</h3>
                    <p className="text-sm text-muted-foreground">{experience.organization}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(experience.startYear)} —{" "}
                      {experience.isCurrent
                        ? t.common.present
                        : formatNumber(experience.endYear ?? 0)}
                    </p>
                    {experience.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {experience.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            {expert.educations.length > 0 ? (
              <Card className="gap-4 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <GraduationCap className="size-5 text-primary" />
                  {t.expert.education}
                </h2>
                <ul className="space-y-3">
                  {expert.educations.map((education) => (
                    <li key={education.id}>
                      <p className="font-medium">
                        {education.degree}
                        {education.field ? ` — ${education.field}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {education.institution}
                        {education.graduationYear
                          ? ` · ${formatNumber(education.graduationYear)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {expert.certifications.length > 0 ? (
              <Card className="gap-4 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Award className="size-5 text-accent" />
                  {t.expert.certifications}
                </h2>
                <ul className="space-y-3">
                  {expert.certifications.map((certification) => (
                    <li key={certification.id} className="rounded-lg border bg-muted/30 p-3">
                      <p className="font-medium">{certification.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {certification.issuer}
                        {certification.issueYear
                          ? ` · ${formatNumber(certification.issueYear)}`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>

          {expert.skills.length > 0 ? (
            <Card className="gap-3 p-6">
              <h2 className="text-lg font-bold">{t.expert.skills}</h2>
              <ul className="flex flex-wrap gap-2">
                {expert.skills.map((skill) => (
                  <li key={skill.id}>
                    <Badge variant="outline" className="px-3 py-1 text-sm font-normal">
                      {skill.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card id="services" className="scroll-mt-20 gap-4 p-6">
            <h2 className="text-lg font-bold">{t.expert.services}</h2>
            <ul className="space-y-4">
              {expert.services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1 space-y-1.5">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t.booking.duration}: {formatMinutes(service.durationMinutes)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span className="text-lg font-bold text-primary">
                      {formatSar(service.priceSar)}
                    </span>
                    <Button asChild>
                      <Link href={`/booking/${expert.userId}?service=${service.id}`}>
                        {t.expert.bookNow}
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-5 p-6">
            <h2 className="text-lg font-bold">{t.expert.reviews}</h2>

            {expert.ratingCount > 0 ? (
              <>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="text-center sm:w-40">
                    <div className="text-4xl font-bold">{expert.ratingAvg.toFixed(1)}</div>
                    <RatingStars
                      rating={expert.ratingAvg}
                      showValue={false}
                      className="mt-1 justify-center"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatNumber(expert.ratingCount)} {t.expert.reviewsCount}
                    </p>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {distribution.map((entry) => (
                      <div key={entry.stars} className="flex items-center gap-3">
                        <span className="flex w-12 items-center justify-end gap-1 text-sm text-muted-foreground">
                          {entry.stars}
                          <Star className="size-3.5 fill-accent text-accent" />
                        </span>
                        <Progress
                          value={(entry.count / maxDistribution) * 100}
                          className="h-2 flex-1"
                        />
                        <span className="w-8 text-sm text-muted-foreground">
                          {formatNumber(entry.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <ul className="space-y-5">
                  {reviews.map((review) => (
                    <li key={review.id} className="space-y-2">
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
                          <p className="mt-2 leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {review.booking.service.name}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState icon={MessageSquareQuote} title={t.reviews.noReviewsYet} />
            )}
          </Card>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="gap-4 p-6">
            <div>
              <p className="text-sm text-muted-foreground">{t.expert.startingFrom}</p>
              <p className="text-3xl font-bold text-primary">
                {startingPrice ? formatSar(startingPrice) : "—"}
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.expert.yearsOfExperience}</span>
                <span className="font-medium">{formatYears(expert.yearsOfExperience)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.expert.consultations}</span>
                <span className="font-medium">{formatNumber(expert.completedConsultations)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.expert.rating}</span>
                <span className="font-medium">
                  {expert.ratingCount > 0 ? expert.ratingAvg.toFixed(1) : t.expert.noReviews}
                </span>
              </div>
            </div>

            {expert.availability.length > 0 ? (
              <>
                <Separator />
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">{t.expert.availability}</h2>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {expert.availability.map((slot) => (
                      <li key={slot.id} className="flex items-center justify-between">
                        <span>{WEEK_DAYS[slot.dayOfWeek].label}</span>
                        <span dir="ltr">
                          {minutesToTimeLabel(slot.startMinute)} — {minutesToTimeLabel(slot.endMinute)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            <Button size="lg" className="h-12 w-full text-base" asChild>
              <Link href={`/booking/${expert.userId}`}>{t.expert.bookConsultation}</Link>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
