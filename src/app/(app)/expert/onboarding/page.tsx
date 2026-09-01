import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileBuilder } from "@/components/expert/profile-builder";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.onboarding.title };

export default async function ExpertOnboardingPage() {
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

  return (
    <div className="container-page max-w-4xl py-8 lg:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t.onboarding.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.onboarding.subtitle}</p>
      </header>

      <ProfileBuilder
        profile={profile}
        categories={categories}
        initialStep={profile.onboardingStep}
      />
    </div>
  );
}
