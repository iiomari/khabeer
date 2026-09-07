import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Lock,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserAvatar } from "@/components/user-avatar";
import { RatingStars } from "@/components/rating-stars";
import { BookingActions } from "@/components/booking/booking-actions";
import { AddToCalendar } from "@/components/booking/add-to-calendar";
import { MeetingRoom } from "@/components/booking/meeting-room";
import { ChatPanel } from "@/components/messages/chat-panel";
import { ReviewForm } from "@/components/reviews/review-form";
import { db } from "@/lib/db";
import { requireUser } from "@/server/session";
import { resolveBookingStatus, STATUS_STYLES } from "@/lib/booking-status";
import { formatDateTime, formatMinutes, formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: t.booking.consultationDetails };

export default async function BookingDetailPage({
  params,
  searchParams,
}: PageProps<"/bookings/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const justBooked = query.success === "1";

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      service: true,
      payment: true,
      review: true,
      conversation: true,
      request: { include: { category: { select: { name: true, icon: true } } } },
      client: { select: { id: true, name: true, avatarUrl: true, email: true, phone: true } },
      expert: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          expertProfile: { select: { headline: true, ratingAvg: true, ratingCount: true } },
        },
      },
    },
  });

  if (!booking || (booking.clientId !== user.id && booking.expertId !== user.id)) notFound();

  const status = resolveBookingStatus(booking);
  const isExpert = booking.expertId === user.id;
  const counterpart = isExpert ? booking.client : booking.expert;
  const backHref = isExpert ? "/dashboard/expert/consultations" : "/dashboard/client/consultations";

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        {t.dashboard.consultations}
      </Link>

      {justBooked ? (
        <Alert className="mb-6 border-success/30 bg-success/8">
          <CheckCircle2 className="text-success" />
          <AlertTitle>{t.booking.successTitle}</AlertTitle>
          <AlertDescription>{t.booking.successBody}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="gap-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">{booking.service.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.booking.bookingRef}: <span dir="ltr">{booking.bookingRef}</span>
                </p>
              </div>
              <Badge className={cn("border px-3 py-1.5 text-sm", STATUS_STYLES[status])}>
                {t.booking.statuses[status]}
              </Badge>
            </div>

            <Separator />

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{t.booking.dateTime}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                  <CalendarClock className="size-4 text-primary" />
                  {formatDateTime(booking.scheduledAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t.booking.duration}</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                  <Clock className="size-4 text-primary" />
                  {formatMinutes(booking.durationMinutes)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{t.booking.price}</dt>
                <dd className="mt-0.5 font-bold text-primary">{formatSar(booking.priceSar)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {isExpert ? t.booking.client : t.booking.expert}
                </dt>
                <dd className="mt-0.5 font-medium">{counterpart.name}</dd>
              </div>
            </dl>

            <div>
              <h2 className="text-sm font-semibold">{t.booking.describeNeed}</h2>
              <p className="mt-1.5 leading-relaxed whitespace-pre-line text-muted-foreground">
                {booking.description}
              </p>
            </div>

            {booking.request ? (
              <div className="rounded-xl border border-primary/25 bg-brand-soft/40 p-4">
                <h2 className="inline-flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-4.5 text-accent" />
                  {t.match.briefForExpert}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.match.briefForExpertHint}</p>

                <dl className="mt-4 space-y-3">
                  {booking.request.category ? (
                    <div className="flex items-center gap-2">
                      <dt className="text-sm text-muted-foreground">{t.match.field}</dt>
                      <dd>
                        <Badge variant="secondary">{booking.request.category.name}</Badge>
                      </dd>
                    </div>
                  ) : null}

                  <div>
                    <dt className="text-sm text-muted-foreground">{t.match.realQuestion}</dt>
                    <dd className="mt-1 leading-relaxed font-medium">
                      {booking.request.reframedQuestion}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">{t.match.neededSkills}</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-2">
                      {booking.request.keySkills.map((skill) => (
                        <Badge key={skill} variant="outline" className="font-normal">
                          {skill}
                        </Badge>
                      ))}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">{t.match.askThese}</dt>
                    <dd>
                      <ol className="mt-1.5 space-y-1.5">
                        {booking.request.questionsToAsk.map((question, index) => (
                          <li key={question} className="flex gap-2.5 text-sm leading-relaxed">
                            <span className="font-semibold text-primary">{index + 1}.</span>
                            <span>{question}</span>
                          </li>
                        ))}
                      </ol>
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {booking.statusReason ? (
              <Alert>
                <AlertTitle>{t.booking.reasonLabel}</AlertTitle>
                <AlertDescription>{booking.statusReason}</AlertDescription>
              </Alert>
            ) : null}

            {status === "CONFIRMED" ? (
              <MeetingRoom
                bookingRef={booking.bookingRef}
                displayName={user.name}
                durationMinutes={booking.durationMinutes}
                startsAt={booking.scheduledAt.toISOString()}
              />
            ) : null}

            {status === "CONFIRMED" ? (
              <div className="rounded-xl border bg-muted/30 p-4">
                <h2 className="mb-2.5 inline-flex items-center gap-1.5 text-sm font-semibold">
                  <CalendarPlus className="size-4 text-primary" />
                  {t.booking.addToCalendar}
                </h2>
                <AddToCalendar
                  title={`${t.brand.name}: ${booking.service.name} — ${counterpart.name}`}
                  description={booking.description}
                  startsAt={booking.scheduledAt.toISOString()}
                  durationMinutes={booking.durationMinutes}
                  bookingRef={booking.bookingRef}
                  location={booking.meetingUrl ?? undefined}
                />
              </div>
            ) : null}

            <BookingActions
              bookingId={booking.id}
              canRespond={isExpert && status === "PENDING"}
              canCancel={status === "PENDING" || status === "CONFIRMED"}
            />
          </Card>

          <Card className="gap-4 p-6">
            <h2 className="text-lg font-bold">{t.messages.title}</h2>
            {booking.conversation ? (
              <ChatPanel
                conversationId={booking.conversation.id}
                currentUserId={user.id}
                counterpartName={counterpart.name}
              />
            ) : (
              <Alert>
                <Lock />
                <AlertTitle>{t.messages.lockedTitle}</AlertTitle>
                <AlertDescription>{t.messages.lockedBody}</AlertDescription>
              </Alert>
            )}
          </Card>

          {!isExpert && status === "COMPLETED" ? (
            <Card className="gap-4 p-6">
              <h2 className="text-lg font-bold">{t.reviews.leaveReview}</h2>
              {booking.review ? (
                <div className="space-y-2 rounded-lg bg-muted/40 p-4">
                  <RatingStars rating={booking.review.rating} showValue={false} />
                  <p className="text-sm text-muted-foreground">{booking.review.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(booking.review.createdAt)}
                  </p>
                </div>
              ) : (
                <ReviewForm bookingId={booking.id} />
              )}
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card className="gap-4 p-6">
            <h2 className="font-bold">{isExpert ? t.booking.client : t.booking.expert}</h2>
            <div className="flex items-center gap-3">
              <UserAvatar
                name={counterpart.name}
                src={counterpart.avatarUrl}
                seed={counterpart.id}
                className="size-12"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{counterpart.name}</p>
                {!isExpert && booking.expert.expertProfile ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {booking.expert.expertProfile.headline}
                  </p>
                ) : null}
              </div>
            </div>

            {!isExpert && booking.expert.expertProfile ? (
              <>
                <RatingStars
                  rating={booking.expert.expertProfile.ratingAvg}
                  count={booking.expert.expertProfile.ratingCount}
                />
                <Button variant="outline" asChild>
                  <Link href={`/experts/${booking.expertId}`}>{t.expert.viewProfile}</Link>
                </Button>
              </>
            ) : null}
          </Card>

          {booking.payment ? (
            <Card className="gap-3 p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <Receipt className="size-4.5 text-primary" />
                {t.payment.receipt}
              </h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.payment.amount}</dt>
                  <dd className="font-semibold">{formatSar(booking.payment.amountSar)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.payment.method}</dt>
                  <dd className="font-medium">
                    {booking.payment.method === "MADA"
                      ? t.payment.mada
                      : booking.payment.method === "APPLE_PAY"
                        ? t.payment.applePay
                        : t.payment.card}
                    {booking.payment.cardLast4 ? ` •••• ${booking.payment.cardLast4}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.payment.transactionRef}</dt>
                  <dd dir="ltr" className="font-mono text-xs">
                    {booking.payment.transactionRef}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.payment.paidAt}</dt>
                  <dd>{formatShortDate(booking.payment.createdAt)}</dd>
                </div>
                {booking.payment.status === "REFUNDED" ? (
                  <div className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                    تم استرجاع المبلغ إلى وسيلة الدفع (عملية تجريبية).
                  </div>
                ) : null}
              </dl>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
