"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { isSlotFree } from "@/server/availability";
import { notify } from "@/server/notifications";
import { getPaymentProvider } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { evaluateLicense } from "@/server/licensing";
import { bookingSchema, paymentSchema } from "@/lib/validation";
import { formatDateTime, formatSar } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import type { PaymentMethod } from "@/lib/enums";

function makeBookingRef() {
  return `KHB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export type BookingActionResult =
  | { ok: true; bookingId: string; bookingRef: string }
  | { ok: false; error: string };

export async function createBookingAction(input: unknown): Promise<BookingActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { ok: false, error: t.common.unauthorized };

  const parsedBooking = bookingSchema.safeParse(input);
  const parsedPayment = paymentSchema.safeParse(input);

  if (!parsedBooking.success) {
    return { ok: false, error: parsedBooking.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }
  if (!parsedPayment.success) {
    return { ok: false, error: parsedPayment.error.issues[0]?.message ?? t.payment.failed };
  }

  const service = await db.consultingService.findUnique({
    where: { id: parsedBooking.data.serviceId },
    include: {
      expertProfile: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          categories: { select: { category: { select: { requiresLicense: true } } } },
        },
      },
    },
  });

  if (!service || !service.isActive || service.expertProfile.verificationStatus !== "VERIFIED") {
    return { ok: false, error: t.common.somethingWentWrong };
  }

  // A regulated field cannot take bookings until the practising licence is approved.
  const licence = evaluateLicense({
    licenseStatus: service.expertProfile.licenseStatus,
    categories: service.expertProfile.categories.map((link) => link.category),
  });
  if (!licence.bookable) return { ok: false, error: t.license.blockedBody };

  const expertUserId = service.expertProfile.user.id;
  if (expertUserId === user.id) return { ok: false, error: t.booking.ownBooking };

  const scheduledAt = new Date(parsedBooking.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
    return { ok: false, error: t.booking.slotTaken };
  }

  const free = await isSlotFree(expertUserId, scheduledAt, service.durationMinutes);
  if (!free) return { ok: false, error: t.booking.slotTaken };

  // Attach the brief only if it really exists, and claim it for this client.
  const requestId = parsedBooking.data.requestId
    ? (
        await db.consultationRequest.findUnique({
          where: { id: parsedBooking.data.requestId },
          select: { id: true },
        })
      )?.id
    : undefined;

  if (requestId) {
    await db.consultationRequest.updateMany({
      where: { id: requestId, clientId: null },
      data: { clientId: user.id },
    });
  }

  const charge = await getPaymentProvider().charge({
    bookingRef: makeBookingRef(),
    amountSar: service.priceSar,
    method: parsedPayment.data.method as PaymentMethod,
    cardNumber: parsedPayment.data.cardNumber,
  });

  if (!charge.success) return { ok: false, error: t.payment.failed };

  const booking = await db.booking.create({
    data: {
      bookingRef: makeBookingRef(),
      clientId: user.id,
      expertId: expertUserId,
      serviceId: service.id,
      scheduledAt,
      durationMinutes: service.durationMinutes,
      priceSar: service.priceSar,
      description: parsedBooking.data.description,
      requestId: requestId ?? null,
      status: "PENDING",
      payment: {
        create: {
          amountSar: service.priceSar,
          method: parsedPayment.data.method,
          status: "PAID",
          transactionRef: charge.transactionRef,
          provider: charge.provider,
          cardLast4: charge.cardLast4,
        },
      },
    },
  });

  await Promise.all([
    notify({
      userId: expertUserId,
      type: "BOOKING_REQUESTED",
      title: "طلب استشارة جديد",
      body: `${user.name} أرسل طلب استشارة: ${service.name} — ${formatDateTime(scheduledAt)}`,
      linkUrl: `/bookings/${booking.id}`,
      relatedId: booking.id,
    }),
    // Email is a courtesy on top of the in-app notification: an expert who is not
    // signed in still learns that a paid request is waiting for an answer.
    sendEmail({
      to: service.expertProfile.user.email,
      subject: `طلب استشارة جديد — ${service.name}`,
      text: [
        "وصلك طلب استشارة جديد على منصة خبير.",
        "",
        `الخدمة: ${service.name}`,
        `العميل: ${user.name}`,
        `الموعد المطلوب: ${formatDateTime(scheduledAt)}`,
        `المبلغ: ${formatSar(service.priceSar)} — مدفوع`,
        `الرقم المرجعي: ${booking.bookingRef}`,
        "",
        "افتح الطلب لقبوله أو رفضه.",
      ].join("\n"),
      action: { label: "فتح الطلب", url: `${siteUrl()}/bookings/${booking.id}` },
    }),
    notify({
      userId: user.id,
      type: "PAYMENT_SUCCESS",
      title: "تمت عملية الدفع بنجاح",
      body: `تم دفع ${formatSar(service.priceSar)} للاستشارة رقم ${booking.bookingRef}`,
      linkUrl: `/bookings/${booking.id}`,
      relatedId: booking.id,
    }),
  ]);

  revalidatePath("/dashboard/client");
  revalidatePath("/dashboard/expert");

  return { ok: true, bookingId: booking.id, bookingRef: booking.bookingRef };
}

async function loadBookingForUser(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, name: true, email: true } },
      expert: { select: { id: true, name: true, email: true } },
      service: { select: { name: true } },
    },
  });

  if (!booking) return null;
  if (booking.clientId !== userId && booking.expertId !== userId) return null;
  return booking;
}

export async function acceptBookingAction(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.common.unauthorized };

  const booking = await loadBookingForUser(bookingId, user.id);
  if (!booking || booking.expertId !== user.id || booking.status !== "PENDING") {
    return { ok: false as const, error: t.common.unauthorized };
  }

  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } }),
    db.conversation.create({
      data: { bookingId: booking.id, clientId: booking.clientId, expertId: booking.expertId },
    }),
  ]);

  await Promise.all([
    notify({
      userId: booking.clientId,
      type: "BOOKING_ACCEPTED",
      title: "تم قبول طلب الاستشارة",
      body: `قبل ${booking.expert.name} طلبك، ويمكنك الآن التواصل معه عبر الرسائل.`,
      linkUrl: `/bookings/${booking.id}`,
      relatedId: booking.id,
    }),
    sendEmail({
      to: booking.client.email,
      subject: `تم تأكيد استشارتك مع ${booking.expert.name}`,
      text: [
        `قبل ${booking.expert.name} طلب استشارتك.`,
        "",
        `الموعد: ${formatDateTime(booking.scheduledAt)}`,
        `الرقم المرجعي: ${booking.bookingRef}`,
        "",
        "من صفحة الاستشارة تقدر تضيف الموعد إلى تقويمك وتبدأ المحادثة مع الخبير.",
      ].join("\n"),
      action: { label: "فتح الاستشارة", url: `${siteUrl()}/bookings/${booking.id}` },
    }),
  ]);

  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath("/dashboard/expert");
  revalidatePath("/dashboard/client");

  return { ok: true as const };
}

export async function rejectBookingAction(bookingId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.common.unauthorized };

  const booking = await loadBookingForUser(bookingId, user.id);
  if (!booking || booking.expertId !== user.id || booking.status !== "PENDING") {
    return { ok: false as const, error: t.common.unauthorized };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "REJECTED", statusReason: reason || null },
  });

  const payment = await db.payment.findUnique({ where: { bookingId: booking.id } });
  if (payment) {
    await getPaymentProvider().refund(payment.transactionRef);
    await db.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
  }

  await notify({
    userId: booking.clientId,
    type: "BOOKING_REJECTED",
    title: "تم رفض طلب الاستشارة",
    body: `اعتذر ${booking.expert.name} عن الموعد المطلوب، وتم استرجاع المبلغ المدفوع.`,
    linkUrl: `/bookings/${booking.id}`,
    relatedId: booking.id,
  });

  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath("/dashboard/expert");
  revalidatePath("/dashboard/client");

  return { ok: true as const };
}

export async function cancelBookingAction(bookingId: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.common.unauthorized };

  const booking = await loadBookingForUser(bookingId, user.id);
  if (!booking || !["PENDING", "CONFIRMED"].includes(booking.status)) {
    return { ok: false as const, error: t.common.unauthorized };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", statusReason: reason || null },
  });

  const payment = await db.payment.findUnique({ where: { bookingId: booking.id } });
  if (payment && payment.status === "PAID") {
    await getPaymentProvider().refund(payment.transactionRef);
    await db.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
  }

  const otherPartyId = user.id === booking.clientId ? booking.expertId : booking.clientId;
  await notify({
    userId: otherPartyId,
    type: "BOOKING_CANCELLED",
    title: "تم إلغاء استشارة",
    body: `تم إلغاء الاستشارة رقم ${booking.bookingRef} (${booking.service.name}).`,
    linkUrl: `/bookings/${booking.id}`,
    relatedId: booking.id,
  });

  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath("/dashboard/expert");
  revalidatePath("/dashboard/client");

  return { ok: true as const };
}
