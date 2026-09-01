import { db } from "@/lib/db";
import { EXPERTS_PAGE_SIZE } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

export type ExpertSearchParams = {
  q?: string;
  category?: string;
  minYears?: number;
  maxPrice?: number;
  minRating?: number;
  city?: string;
  availableOnly?: boolean;
  sort?: "rating" | "experience" | "price" | "consultations";
  page?: number;
};

export type ExpertListItem = Awaited<ReturnType<typeof searchExperts>>["items"][number];

export async function searchExperts(params: ExpertSearchParams) {
  const page = Math.max(1, params.page ?? 1);

  const where: Prisma.ExpertProfileWhereInput = {
    verificationStatus: "VERIFIED",
    user: { status: "ACTIVE" },
    services: { some: { isActive: true } },
  };

  if (params.q) {
    where.OR = [
      { headline: { contains: params.q } },
      { bio: { contains: params.q } },
      { previousTitle: { contains: params.q } },
      { previousOrganization: { contains: params.q } },
      { user: { is: { name: { contains: params.q } } } },
      { skills: { some: { name: { contains: params.q } } } },
      { categories: { some: { category: { is: { name: { contains: params.q } } } } } },
      { services: { some: { name: { contains: params.q } } } },
    ];
  }

  if (params.category) {
    where.categories = { some: { category: { is: { slug: params.category } } } };
  }
  if (params.minYears) where.yearsOfExperience = { gte: params.minYears };
  if (params.maxPrice) where.minPriceSar = { lte: params.maxPrice, not: null };
  if (params.minRating) where.ratingAvg = { gte: params.minRating };
  if (params.city) where.city = params.city;
  if (params.availableOnly) where.availability = { some: {} };

  const orderBy: Prisma.ExpertProfileOrderByWithRelationInput[] =
    params.sort === "experience"
      ? [{ yearsOfExperience: "desc" }, { ratingAvg: "desc" }]
      : params.sort === "price"
        ? [{ minPriceSar: "asc" }, { ratingAvg: "desc" }]
        : params.sort === "consultations"
          ? [{ completedConsultations: "desc" }, { ratingAvg: "desc" }]
          : [{ ratingAvg: "desc" }, { ratingCount: "desc" }];

  const [items, total] = await Promise.all([
    db.expertProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * EXPERTS_PAGE_SIZE,
      take: EXPERTS_PAGE_SIZE,
      select: {
        id: true,
        userId: true,
        headline: true,
        previousTitle: true,
        previousOrganization: true,
        yearsOfExperience: true,
        city: true,
        ratingAvg: true,
        ratingCount: true,
        completedConsultations: true,
        minPriceSar: true,
        verificationStatus: true,
        user: { select: { name: true, avatarUrl: true } },
        skills: { select: { id: true, name: true }, take: 4 },
        categories: { select: { category: { select: { name: true, slug: true } } }, take: 2 },
      },
    }),
    db.expertProfile.count({ where }),
  ]);

  return { items, total, page, pageSize: EXPERTS_PAGE_SIZE };
}

export async function getFeaturedExperts(limit = 6) {
  return db.expertProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      user: { status: "ACTIVE" },
      services: { some: { isActive: true } },
    },
    orderBy: [{ ratingAvg: "desc" }, { completedConsultations: "desc" }],
    take: limit,
    select: {
      id: true,
      userId: true,
      headline: true,
      previousTitle: true,
      previousOrganization: true,
      yearsOfExperience: true,
      city: true,
      ratingAvg: true,
      ratingCount: true,
      completedConsultations: true,
      minPriceSar: true,
      verificationStatus: true,
      user: { select: { name: true, avatarUrl: true } },
      skills: { select: { id: true, name: true }, take: 4 },
      categories: { select: { category: { select: { name: true, slug: true } } }, take: 2 },
    },
  });
}

export async function getExpertProfile(userId: string) {
  return db.expertProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, city: true, status: true } },
      experiences: { orderBy: [{ isCurrent: "desc" }, { startYear: "desc" }] },
      educations: { orderBy: { graduationYear: "desc" } },
      certifications: { orderBy: { issueYear: "desc" } },
      skills: true,
      categories: { include: { category: true } },
      services: { where: { isActive: true }, orderBy: { priceSar: "asc" } },
      availability: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
    },
  });
}

export async function getExpertReviews(expertUserId: string) {
  const reviews = await db.review.findMany({
    where: { expertId: expertUserId, isHidden: false },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, avatarUrl: true } },
      booking: { select: { service: { select: { name: true } } } },
    },
  });

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  return { reviews, distribution };
}

export async function recalculateExpertRating(expertUserId: string) {
  const aggregate = await db.review.aggregate({
    where: { expertId: expertUserId, isHidden: false },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await db.expertProfile.update({
    where: { userId: expertUserId },
    data: {
      ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
      ratingCount: aggregate._count.rating,
    },
  });
}

export async function syncExpertMinPrice(expertProfileId: string) {
  const aggregate = await db.consultingService.aggregate({
    where: { expertProfileId, isActive: true },
    _min: { priceSar: true },
  });

  await db.expertProfile.update({
    where: { id: expertProfileId },
    data: { minPriceSar: aggregate._min.priceSar ?? null },
  });
}
