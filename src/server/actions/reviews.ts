"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { notify } from "@/server/notifications";
import { recalculateExpertRating } from "@/server/experts";
import { grantRewards } from "@/server/rewards";
import { resolveBookingStatus } from "@/lib/booking-status";
import { reviewSchema } from "@/lib/validation";
import { t } from "@/lib/i18n/ar";

export async function submitReviewAction(bookingId: string, input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.common.unauthorized };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { review: true, client: { select: { name: true } } },
  });

  if (!booking || booking.clientId !== user.id) {
    return { ok: false as const, error: t.common.unauthorized };
  }
  if (booking.review) return { ok: false as const, error: t.reviews.alreadyReviewed };
  if (resolveBookingStatus(booking) !== "COMPLETED") {
    return { ok: false as const, error: t.reviews.onlyAfterCompletion };
  }

  await db.review.create({
    data: {
      bookingId: booking.id,
      clientId: booking.clientId,
      expertId: booking.expertId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED", completedAt: booking.completedAt ?? new Date() },
  });

  await Promise.all([
    recalculateExpertRating(booking.expertId),
    db.expertProfile.update({
      where: { userId: booking.expertId },
      data: { completedConsultations: { increment: 0 } },
    }),
    notify({
      userId: booking.expertId,
      type: "NEW_REVIEW",
      title: "تم استلام تقييم جديد",
      body: `${booking.client.name} قيّم استشارتك بـ ${parsed.data.rating} من ٥.`,
      linkUrl: "/dashboard/expert/reviews",
      relatedId: booking.id,
    }),
  ]);

  // A review is the clearest signal a consultation really happened, so it is the
  // natural moment to check whether the expert crossed a reward milestone.
  await grantRewards(booking.expertId);

  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath(`/experts/${booking.expertId}`);
  revalidatePath("/dashboard/expert/reviews");
  revalidatePath("/dashboard/expert/rewards");

  return { ok: true as const };
}
