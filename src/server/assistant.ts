import { db } from "@/lib/db";
import { formatDateTime, formatSar } from "@/lib/format";
import type { SessionUser } from "@/server/session";

/**
 * A short, factual snapshot of *this* user's own account, handed to the
 * assistant so it answers "ما حالة حجوزاتي؟" with real numbers instead of
 * generic prose. Every query is scoped by the session's user id — the
 * assistant can never reach another account's data.
 */
export async function getAccountContext(user: SessionUser): Promise<string> {
  const lines: string[] = [`المستخدم: ${user.name} · الدور: ${user.role}`];

  if (user.role === "CLIENT") {
    const [bookings, spend, unread] = await Promise.all([
      db.booking.findMany({
        where: { clientId: user.id },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        select: {
          status: true,
          scheduledAt: true,
          priceSar: true,
          expert: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      db.payment.aggregate({ where: { booking: { clientId: user.id }, status: "PAID" }, _sum: { amountSar: true } }),
      db.message.count({
        where: { readAt: null, conversation: { clientId: user.id }, senderId: { not: user.id } },
      }),
    ]);

    lines.push(`عدد حجوزاته: ${bookings.length}`, `إجمالي ما دفعه: ${formatSar(spend._sum.amountSar ?? 0)}`,
      `رسائل غير مقروءة: ${unread}`);
    for (const b of bookings) {
      lines.push(`- ${b.service.name} مع ${b.expert.name} · ${b.status} · ${formatDateTime(b.scheduledAt)} · ${formatSar(b.priceSar)}`);
    }
  }

  if (user.role === "EXPERT") {
    const [profile, pending, earnings, reviews] = await Promise.all([
      db.expertProfile.findUnique({
        where: { userId: user.id },
        select: { verificationStatus: true, rejectionReason: true, ratingAvg: true, ratingCount: true, minPriceSar: true },
      }),
      db.booking.count({ where: { expertId: user.id, status: "PENDING" } }),
      db.payment.aggregate({ where: { booking: { expertId: user.id }, status: "PAID" }, _sum: { amountSar: true } }),
      db.review.count({ where: { expertId: user.id } }),
    ]);

    lines.push(
      `حالة توثيق ملفه: ${profile?.verificationStatus ?? "غير معروف"}`,
      profile?.rejectionReason ? `سبب الرفض: ${profile.rejectionReason}` : "لا يوجد سبب رفض",
      `طلبات تنتظر ردّه: ${pending}`,
      `إجمالي أرباحه: ${formatSar(earnings._sum.amountSar ?? 0)}`,
      `تقييمه: ${profile?.ratingAvg ?? 0} من ${reviews} تقييم`,
    );
  }

  if (user.role === "ADMIN") {
    const [pendingProfiles, users, bookings] = await Promise.all([
      db.expertProfile.count({ where: { verificationStatus: "PENDING" } }),
      db.user.count(),
      db.booking.count(),
    ]);
    lines.push(`ملفات تنتظر التوثيق: ${pendingProfiles}`, `عدد المستخدمين: ${users}`, `عدد الحجوزات: ${bookings}`);
  }

  return lines.join("\n");
}
