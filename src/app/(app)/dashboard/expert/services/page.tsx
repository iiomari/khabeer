import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { ServicesManager } from "@/components/expert/services-manager";
import { EmptyState } from "@/components/empty-state";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.myServices };

export default async function ExpertServicesPage() {
  const user = await requireRole("EXPERT");

  const profile = await db.expertProfile.findUnique({
    where: { userId: user.id },
    include: { services: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.myServices}</h1>
        <p className="mt-1 text-muted-foreground">{t.onboarding.step3Hint}</p>
      </header>

      {profile ? (
        <ServicesManager services={profile.services} />
      ) : (
        <EmptyState icon={Briefcase} title={t.expert.profileDraft} />
      )}
    </div>
  );
}
