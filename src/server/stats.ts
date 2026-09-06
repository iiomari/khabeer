import { db } from "@/lib/db";

export async function getPlatformStats() {
  const [experts, consultations, categories, ratingAggregate] = await Promise.all([
    db.expertProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    db.category.count(),
    db.expertProfile.aggregate({
      where: { verificationStatus: "VERIFIED", ratingCount: { gt: 0 } },
      _avg: { ratingAvg: true },
    }),
  ]);

  return {
    experts,
    consultations,
    categories,
    averageRating: Number((ratingAggregate._avg.ratingAvg ?? 0).toFixed(1)),
  };
}

export async function getCategoriesWithCounts() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      _count: {
        select: { experts: { where: { expertProfile: { verificationStatus: "VERIFIED" } } } },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    expertCount: category._count.experts,
  }));
}

export async function getAdminStats() {
  const [users, experts, clients, bookings, completed, revenue, pendingVerifications] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "EXPERT" } }),
      db.user.count({ where: { role: "CLIENT" } }),
      db.booking.count(),
      db.booking.count({ where: { status: "COMPLETED" } }),
      db.payment.aggregate({ where: { status: "PAID" }, _sum: { amountSar: true } }),
      db.expertProfile.count({ where: { verificationStatus: "PENDING" } }),
    ]);

  return {
    users,
    experts,
    clients,
    bookings,
    completed,
    revenue: revenue._sum.amountSar ?? 0,
    pendingVerifications,
  };
}

export async function getTestimonials(limit = 3) {
  return db.review.findMany({
    where: { isHidden: false, rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      client: { select: { id: true, name: true, avatarUrl: true, clientProfile: { select: { companyName: true } } } },
      expert: {
        select: { id: true, name: true, expertProfile: { select: { headline: true } } },
      },
    },
  });
}

/**
 * Which fields clients actually ask about, taken from the briefs rather than from
 * the categories experts self-select. This is the signal that tells the platform
 * where to recruit next.
 */
export async function getDemandPulse(limit = 6) {
  const grouped = await db.consultationRequest.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: limit,
  });

  const ids = grouped.map((row) => row.categoryId).filter((id): id is string => id !== null);
  const categories = await db.category.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true, icon: true },
  });

  const byId = new Map(categories.map((category) => [category.id, category]));
  const total = grouped.reduce((sum, row) => sum + row._count._all, 0);

  return grouped.flatMap((row) => {
    const category = row.categoryId ? byId.get(row.categoryId) : null;
    if (!category) return [];
    return [{ ...category, count: row._count._all, share: total ? row._count._all / total : 0 }];
  });
}
