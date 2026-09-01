import { db } from "@/lib/db";

export async function getExpertDashboardData(expertUserId: string) {
  const now = new Date();

  const [profile, payments, upcoming, requests, reviews, completedCount] = await Promise.all([
    db.expertProfile.findUnique({
      where: { userId: expertUserId },
      select: {
        id: true,
        verificationStatus: true,
        rejectionReason: true,
        ratingAvg: true,
        ratingCount: true,
        completedConsultations: true,
        onboardingStep: true,
        headline: true,
        _count: { select: { services: true, availability: true } },
      },
    }),
    db.payment.findMany({
      where: { status: "PAID", booking: { expertId: expertUserId } },
      select: { amountSar: true, createdAt: true },
    }),
    db.booking.findMany({
      where: {
        expertId: expertUserId,
        status: "CONFIRMED",
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: {
        service: { select: { name: true } },
        client: { select: { name: true, avatarUrl: true } },
      },
    }),
    db.booking.findMany({
      where: { expertId: expertUserId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { name: true } },
        client: { select: { name: true, avatarUrl: true } },
      },
    }),
    db.review.findMany({
      where: { expertId: expertUserId, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        client: { select: { name: true, avatarUrl: true } },
        booking: { select: { service: { select: { name: true } } } },
      },
    }),
    db.booking.count({ where: { expertId: expertUserId, status: "COMPLETED" } }),
  ]);

  const totalEarnings = payments.reduce((sum, payment) => sum + payment.amountSar, 0);

  const monthly: { month: string; earnings: number }[] = [];
  for (let index = 5; index >= 0; index--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
    const earnings = payments
      .filter(
        (payment) => payment.createdAt >= monthStart && payment.createdAt < monthEnd,
      )
      .reduce((sum, payment) => sum + payment.amountSar, 0);

    monthly.push({
      month: new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { month: "short" }).format(
        monthStart,
      ),
      earnings,
    });
  }

  return {
    profile,
    totalEarnings,
    monthly,
    upcoming,
    requests,
    reviews,
    completedCount,
  };
}
