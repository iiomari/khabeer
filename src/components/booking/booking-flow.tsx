"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createBookingAction } from "@/server/actions/bookings";
import { formatDate, formatMinutes, formatSar, formatTime } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceSar: number;
};

type DaySlots = {
  dateKey: string;
  date: string;
  slots: { startMinute: number; startsAt: string }[];
};

const STEPS = [
  t.booking.selectService,
  t.booking.selectDate,
  t.booking.describeNeed,
  t.booking.review,
  t.booking.payment,
];

const PAYMENT_METHODS = [
  { value: "MADA", label: t.payment.mada },
  { value: "APPLE_PAY", label: t.payment.applePay },
  { value: "CARD", label: t.payment.card },
] as const;

export function BookingFlow({
  expertId,
  expertName,
  services,
  initialServiceId,
  requestId,
  initialDescription,
}: {
  expertId: string;
  expertName: string;
  services: Service[];
  initialServiceId?: string;
  /** Set when the client arrived from an AI match — links the booking back to the brief. */
  requestId?: string;
  initialDescription?: string;
}) {
  const router = useRouter();
  // Arriving from a match means the service and the description are already settled,
  // so the flow opens on the only thing still to decide: the time.
  const [step, setStep] = useState(requestId ? 1 : 0);
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? "");
  const [slotState, setSlotState] = useState<{ serviceId: string; days: DaySlots[] } | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["value"]>("MADA");
  const [card, setCard] = useState({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const service = services.find((item) => item.id === serviceId);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    const currentServiceId = service.id;

    fetch(`/api/experts/${expertId}/slots?duration=${service.durationMinutes}`)
      .then((response) => response.json())
      .then((data: { days: DaySlots[] }) => {
        if (!cancelled) setSlotState({ serviceId: currentServiceId, days: data.days });
      })
      .catch(() => {
        if (!cancelled) setSlotState({ serviceId: currentServiceId, days: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [expertId, service]);

  // Slots belong to a specific service, so anything picked for another service is ignored.
  const days = slotState?.serviceId === serviceId ? slotState.days : null;
  const selectedDay =
    pickedDay && days?.some((day) => day.dateKey === pickedDay)
      ? pickedDay
      : (days?.[0]?.dateKey ?? null);
  const activeDay = days?.find((day) => day.dateKey === selectedDay);
  const selectedSlot =
    pickedSlot &&
    days?.some((day) => day.slots.some((slot) => slot.startsAt === pickedSlot))
      ? pickedSlot
      : null;

  function next() {
    setError(null);
    if (step === 1 && !selectedSlot) return setError(t.booking.noSlots);
    if (step === 2 && description.trim().length < 20) return setError(t.validation.tooShort(20));
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((current) => Math.max(current - 1, requestId ? 1 : 0));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createBookingAction({
        serviceId,
        scheduledAt: selectedSlot,
        description,
        requestId,
        method,
        ...card,
        cardNumber: card.cardNumber.replace(/\s/g, ""),
      });

      if (result.ok) {
        toast.success(t.payment.success);
        router.push(`/bookings/${result.bookingId}?success=1`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!service) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{t.expert.notAvailable}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <ol className="flex flex-wrap items-center gap-2" aria-label={t.booking.title}>
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-sm font-semibold",
                  index < step && "border-primary bg-primary text-primary-foreground",
                  index === step && "border-primary bg-brand-soft text-primary",
                  index > step && "border-border text-muted-foreground",
                )}
                aria-current={index === step ? "step" : undefined}
              >
                {index < step ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  index === step ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <ChevronLeft className="size-4 text-muted-foreground" />
              ) : null}
            </li>
          ))}
        </ol>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="gap-5 p-6">
          {step === 0 ? (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-lg font-bold">{t.booking.selectService}</legend>
              {services.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    serviceId === item.id
                      ? "border-primary bg-brand-soft/60"
                      : "hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    name="service"
                    value={item.id}
                    checked={serviceId === item.id}
                    onChange={() => setServiceId(item.id)}
                    className="mt-1.5 size-4 accent-[var(--color-primary)]"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold">{item.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <Badge variant="secondary">{formatMinutes(item.durationMinutes)}</Badge>
                      <span className="font-bold text-primary">{formatSar(item.priceSar)}</span>
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">
                {t.booking.selectDate} و{t.booking.selectTime}
              </h2>

              {days === null ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : days.length === 0 ? (
                <Alert>
                  <CalendarDays />
                  <AlertDescription>{t.expert.notAvailable}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {days.map((day) => (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => {
                          setPickedDay(day.dateKey);
                          setPickedSlot(null);
                        }}
                        className={cn(
                          "min-w-28 shrink-0 rounded-xl border px-3 py-2.5 text-center transition-colors",
                          selectedDay === day.dateKey
                            ? "border-primary bg-brand-soft/60"
                            : "hover:border-primary/40",
                        )}
                      >
                        <span className="block text-sm font-medium">
                          {new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
                            weekday: "short",
                          }).format(new Date(day.date))}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(day.date))}
                        </span>
                      </button>
                    ))}
                  </div>

                  {activeDay ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {activeDay.slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setPickedSlot(slot.startsAt)}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                            selectedSlot === slot.startsAt
                              ? "border-primary bg-primary text-primary-foreground"
                              : "hover:border-primary/40",
                          )}
                        >
                          {formatTime(slot.startsAt)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold">{t.booking.describeNeed}</h2>
              <Label htmlFor="description" className="sr-only">
                {t.booking.describeNeed}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t.booking.describePlaceholder}
                rows={7}
                className="text-base"
              />
              <p className="text-sm text-muted-foreground">
                {description.trim().length} / 1000
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{t.booking.review}</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.expert}</dt>
                  <dd className="font-medium">{expertName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.selectService}</dt>
                  <dd className="text-end font-medium">{service.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.dateTime}</dt>
                  <dd className="text-end font-medium">
                    {selectedSlot ? `${formatDate(selectedSlot)} — ${formatTime(selectedSlot)}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t.booking.duration}</dt>
                  <dd className="font-medium">{formatMinutes(service.durationMinutes)}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-4 text-base">
                  <dt className="font-semibold">{t.booking.total}</dt>
                  <dd className="font-bold text-primary">{formatSar(service.priceSar)}</dd>
                </div>
              </dl>

              <div className="rounded-lg bg-muted/40 p-4">
                <h3 className="text-sm font-semibold">{t.booking.describeNeed}</h3>
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">{t.payment.title}</h2>
                <p className="text-sm text-muted-foreground">{t.payment.subtitle}</p>
              </div>

              <Alert>
                <ShieldCheck />
                <AlertDescription>{t.payment.sandboxNotice}</AlertDescription>
              </Alert>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">{t.payment.method}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMethod(option.value)}
                      aria-pressed={method === option.value}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                        method === option.value
                          ? "border-primary bg-brand-soft/60"
                          : "hover:border-primary/40",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {method === "APPLE_PAY" ? (
                <Alert>
                  <CreditCard />
                  <AlertDescription>{t.payment.applePayHint}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">{t.payment.cardName}</Label>
                    <Input
                      id="cardName"
                      value={card.cardName}
                      onChange={(event) => setCard({ ...card, cardName: event.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t.payment.cardNumber}</Label>
                    <Input
                      id="cardNumber"
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={card.cardNumber}
                      onChange={(event) =>
                        setCard({
                          ...card,
                          cardNumber: event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 16)
                            .replace(/(.{4})/g, "$1 ")
                            .trim(),
                        })
                      }
                      className="h-12 text-start"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">{t.payment.expiry}</Label>
                      <Input
                        id="expiry"
                        dir="ltr"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(event) => {
                          const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                          const formatted =
                            digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                          setCard({ ...card, expiry: formatted });
                        }}
                        className="h-12 text-start"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">{t.payment.cvv}</Label>
                      <Input
                        id="cvv"
                        dir="ltr"
                        inputMode="numeric"
                        value={card.cvv}
                        onChange={(event) =>
                          setCard({ ...card, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })
                        }
                        className="h-12 text-start"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0 || pending}
              className="gap-1"
            >
              <ChevronRight className="size-4" />
              {t.common.previous}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" size="lg" onClick={next} className="gap-1">
                {step === 3 ? t.booking.proceedToPayment : t.common.next}
                <ChevronLeft className="size-4" />
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={submit} disabled={pending} className="gap-2">
                {pending ? <Loader2 className="size-4.5 animate-spin" /> : <CreditCard className="size-4.5" />}
                {pending ? t.payment.processing : t.payment.payNow(formatSar(service.priceSar))}
              </Button>
            )}
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="gap-4 p-6">
          <h2 className="font-bold">{t.payment.summary}</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t.booking.expert}</dt>
              <dd className="text-end font-medium">{expertName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t.booking.selectService}</dt>
              <dd className="text-end font-medium">{service.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t.booking.duration}</dt>
              <dd className="font-medium">{formatMinutes(service.durationMinutes)}</dd>
            </div>
            {selectedSlot ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t.booking.dateTime}</dt>
                <dd className="text-end font-medium">
                  {formatDate(selectedSlot)}
                  <br />
                  {formatTime(selectedSlot)}
                </dd>
              </div>
            ) : null}
          </dl>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">{t.booking.total}</span>
            <span className="text-xl font-bold text-primary">{formatSar(service.priceSar)}</span>
          </div>
        </Card>
      </aside>
    </div>
  );
}
