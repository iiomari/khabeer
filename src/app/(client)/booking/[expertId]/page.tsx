import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getExpertProfile } from "@/server/experts";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.booking.title };

export default async function BookingPage({ params, searchParams }: PageProps<"/booking/[expertId]">) {
  await requireRole("CLIENT");

  const { expertId } = await params;
  const query = await searchParams;
  const serviceParam = Array.isArray(query.service) ? query.service[0] : query.service;

  const expert = await getExpertProfile(expertId);
  if (!expert || expert.verificationStatus !== "VERIFIED" || expert.services.length === 0) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 py-8 lg:py-12">
        <div className="mb-6">
          <Link
            href={`/experts/${expertId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            {expert.user.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{t.booking.title}</h1>
        </div>

        <BookingFlow
          expertId={expertId}
          expertName={expert.user.name}
          initialServiceId={serviceParam}
          services={expert.services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            priceSar: service.priceSar,
          }))}
        />
      </main>
    </>
  );
}
