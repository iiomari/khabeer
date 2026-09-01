import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileBuilder } from "@/components/expert/profile-builder";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.myProfile };

export default async function ExpertProfilePage() {
  const user = await requireRole("EXPERT");

  const [profile, categories] = await Promise.all([
    db.expertProfile.findUnique({
      where: { userId: user.id },
      include: {
        categories: { include: { category: { select: { id: true, name: true } } } },
        experiences: { orderBy: { startYear: "desc" } },
        educations: true,
        certifications: true,
        skills: true,
        services: { orderBy: { createdAt: "asc" } },
        availability: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!profile) redirect("/dashboard/expert");

  const statusLabel =
    t.admin.verificationStatuses[
      profile.verificationStatus as keyof typeof t.admin.verificationStatuses
    ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.myProfile}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">{statusLabel}</Badge>
            {profile.verificationStatus === "VERIFIED" ? (
              <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                <Link href={`/experts/${user.id}`}>
                  <ExternalLink className="size-4" />
                  {t.expert.viewProfile}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <ProfileBuilder profile={profile} categories={categories} initialStep={1} />
    </div>
  );
}
