import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";
import { EmptyState } from "@/components/empty-state";
import { ExpertVerificationActions } from "@/components/admin/expert-verification-actions";
import { LicenseReview } from "@/components/admin/license-review";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatNumber, formatSar, formatYears } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.admin.experts };

export default async function AdminExpertsPage() {
  await requireRole("ADMIN");

  const profiles = await db.expertProfile.findMany({
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true } },
      certifications: true,
      categories: { include: { category: { select: { name: true, requiresLicense: true } } } },
      _count: { select: { services: true } },
    },
  });

  const pending = profiles.filter((profile) => profile.verificationStatus === "PENDING");
  const others = profiles.filter((profile) => profile.verificationStatus !== "PENDING");

  function renderProfile(profile: (typeof profiles)[number]) {
    const statusLabel =
      t.admin.verificationStatuses[
        profile.verificationStatus as keyof typeof t.admin.verificationStatuses
      ];

    return (
      <Card key={profile.id} className="gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <UserAvatar
              name={profile.user.name}
              src={profile.user.avatarUrl}
              seed={profile.userId}
              className="size-12"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{profile.user.name}</h3>
                <Badge variant="secondary">{statusLabel}</Badge>
                {profile.user.status === "SUSPENDED" ? (
                  <Badge variant="destructive">{t.admin.suspended}</Badge>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">{profile.headline}</p>
              <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">
                {profile.user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profile.verificationStatus === "VERIFIED" ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/experts/${profile.userId}`}>{t.expert.viewProfile}</Link>
              </Button>
            ) : null}
            <UserStatusToggle userId={profile.user.id} status={profile.user.status} />
          </div>
        </div>

        <Separator />

        <dl className="grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t.expert.yearsOfExperience}</dt>
            <dd className="font-medium">{formatYears(profile.yearsOfExperience)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.expert.services}</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <Briefcase className="size-4" />
              {formatNumber(profile._count.services)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.expert.startingFrom}</dt>
            <dd className="font-medium">
              {profile.minPriceSar ? formatSar(profile.minPriceSar) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.expert.rating}</dt>
            <dd>
              <RatingStars rating={profile.ratingAvg} count={profile.ratingCount} />
            </dd>
          </div>
        </dl>

        {profile.certifications.length > 0 ? (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Award className="size-4 text-accent" />
              {t.expert.certifications}
            </h4>
            <ul className="flex flex-wrap gap-2">
              {profile.certifications.map((certification) => (
                <li key={certification.id}>
                  <Badge variant="outline" className="font-normal">
                    {certification.name} — {certification.issuer}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {profile.categories.some((link) => link.category.requiresLicense) ? (
          <LicenseReview
            expertProfileId={profile.id}
            status={profile.licenseStatus}
            fieldNames={profile.categories
              .filter((link) => link.category.requiresLicense)
              .map((link) => link.category.name)}
            licenseNumber={profile.licenseNumber}
            licenseIssuer={profile.licenseIssuer}
            licenseExpiry={profile.licenseExpiry?.toISOString() ?? null}
            licenseDocUrl={profile.licenseDocUrl}
          />
        ) : null}

        {profile.verificationStatus !== "VERIFIED" ? (
          <ExpertVerificationActions expertProfileId={profile.id} />
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.admin.experts}</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">
          {t.admin.pendingVerifications}
          {pending.length > 0 ? <Badge className="ms-2">{formatNumber(pending.length)}</Badge> : null}
        </h2>
        {pending.length === 0 ? (
          <EmptyState icon={BadgeCheck} title={t.admin.noPending} />
        ) : (
          <div className="space-y-3">{pending.map(renderProfile)}</div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{t.common.all}</h2>
        <div className="space-y-3">{others.map(renderProfile)}</div>
      </section>
    </div>
  );
}
