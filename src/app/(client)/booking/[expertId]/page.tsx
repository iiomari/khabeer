import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { evaluateLicense } from "@/server/licensing";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getExpertProfile } from "@/server/experts";
import { requireRole } from "@/server/session";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.booking.title };

export default async function BookingPage({ params, searchParams }: PageProps<"/booking/[expertId]">) {
  const { expertId } = await params;
  const query = await searchParams;
  const serviceParam = Array.isArray(query.service) ? query.service[0] : query.service;
  const requestParam = Array.isArray(query.request) ? query.request[0] : query.request;

  // Guests coming from a match land back here after signing in, brief intact.
  await requireRole(
    "CLIENT",
    `/booking/${expertId}${requestParam ? `?request=${requestParam}` : ""}`,
  );

  const expert = await getExpertProfile(expertId);
  if (!expert || expert.verificationStatus !== "VERIFIED" || expert.services.length === 0) {
    notFound();
  }

  // Guarding the buttons is not enough — the URL is guessable, so the page itself
  // refuses a booking with an expert whose practising licence is not approved.
  const licence = evaluateLicense({
    licenseStatus: expert.licenseStatus,
    categories: expert.categories.map((link) => link.category),
  });
  if (!licence.bookable) {
    return (
      <>
        <SiteHeader />
        <main className="container-page flex-1 py-16">
          <EmptyState
            icon={ShieldAlert}
            title={t.license.blockedTitle}
            description={t.license.blockedBody}
            action={
              <Button asChild>
                <Link href={`/experts/${expertId}`}>{t.match.viewProfile}</Link>
              </Button>
            }
          />
        </main>
      </>
    );
  }

  const request = requestParam
    ? await db.consultationRequest.findUnique({
        where: { id: requestParam },
        select: { id: true, reframedQuestion: true, rawText: true, suggestedMinutes: true },
      })
    : null;

  // Pick the offered service whose length is closest to what the brief suggested.
  const matchedService = request
    ? expert.services.reduce((best, current) =>
        Math.abs(current.durationMinutes - request.suggestedMinutes) <
        Math.abs(best.durationMinutes - request.suggestedMinutes)
          ? current
          : best,
      )
    : null;

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
          initialServiceId={serviceParam ?? matchedService?.id}
          requestId={request?.id}
          initialDescription={request ? `${request.reframedQuestion}\n\n${request.rawText}` : undefined}
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
