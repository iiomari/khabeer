import { db } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

export type Kpi = {
  key: string;
  label: string;
  /** Already formatted for display. */
  value: string;
  /** What a healthy number looks like, so the figure can be judged not just read. */
  target: string;
  /** ok = at or better than target · warn = close · bad = clearly under. */
  health: "ok" | "warn" | "bad";
  hint: string;
};

/** Hours read badly past a day or two, so anything longer is shown in days. */
function formatHours(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return "أقل من ساعة";
  if (hours < 48) return `${Math.round(hours)} ساعة`;
  return `${Math.round(hours / 24)} يومًا`;
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function grade(value: number, good: number, poor: number, higherIsBetter = true): Kpi["health"] {
  if (higherIsBetter) return value >= good ? "ok" : value >= poor ? "warn" : "bad";
  return value <= good ? "ok" : value <= poor ? "warn" : "bad";
}

/**
 * The numbers that say whether the marketplace is actually working, rather than
 * how much data it holds. Each one is paired with a target so a reader can judge
 * it — a KPI with no target is just a statistic.
 *
 * All windows are 30 days unless stated, so the figures move with recent
 * behaviour instead of being dominated by the platform's whole history.
 */
export async function getPlatformKpis(): Promise<Kpi[]> {
  const since = new Date(Date.now() - 30 * DAY);

  const [
    requests,
    requestsWithBooking,
    bookings,
    accepted,
    rejected,
    completed,
    cancelled,
    dueInWindow,
    reviewed,
    revenue,
    verifiedExperts,
    bookableExperts,
    activeExperts,
    pendingVerification,
    ratingAgg,
    respondedPairs,
  ] = await Promise.all([
    db.consultationRequest.count({ where: { createdAt: { gte: since } } }),
    db.booking.count({ where: { createdAt: { gte: since }, requestId: { not: null } } }),
    db.booking.count({ where: { createdAt: { gte: since } } }),
    db.booking.count({ where: { createdAt: { gte: since }, status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    db.booking.count({ where: { createdAt: { gte: since }, status: "REJECTED" } }),
    // Same cohort on both sides: appointments whose time has already passed in the
    // window. Comparing "completed by appointment date" against "accepted by
    // creation date" measured two different sets and always read low.
    db.booking.count({
      where: { status: "COMPLETED", scheduledAt: { gte: since, lte: new Date() } },
    }),
    db.booking.count({ where: { createdAt: { gte: since }, status: "CANCELLED" } }),
    db.booking.count({
      where: {
        scheduledAt: { gte: since, lte: new Date() },
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
    }),
    db.review.count({ where: { createdAt: { gte: since } } }),
    db.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: since } },
      _sum: { amountSar: true },
      _count: { _all: true },
    }),
    db.expertProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.expertProfile.count({
      where: {
        verificationStatus: "VERIFIED",
        services: { some: { isActive: true } },
        availability: { some: {} },
      },
    }),
    db.booking.findMany({
      where: { createdAt: { gte: since } },
      select: { expertId: true },
      distinct: ["expertId"],
    }),
    db.expertProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.expertProfile.aggregate({
      where: { ratingCount: { gt: 0 } },
      _avg: { ratingAvg: true },
    }),
    db.booking.findMany({
      where: { createdAt: { gte: since }, respondedAt: { not: null } },
      select: { createdAt: true, respondedAt: true },
    }),
  ]);

  // Median rather than mean: one expert who answered after a week would drag a
  // mean far from what a typical client actually experiences.
  const responseHours = respondedPairs
    .map((b) => (b.respondedAt!.getTime() - b.createdAt.getTime()) / 3_600_000)
    .filter((hours) => hours >= 0)
    .sort((a, b) => a - b);
  const medianResponse = responseHours.length
    ? responseHours[Math.floor(responseHours.length / 2)]
    : 0;

  const answered = accepted + rejected;
  const requestConversion = pct(requestsWithBooking, requests);
  const acceptanceRate = pct(accepted, answered);
  const completionRate = pct(completed, dueInWindow);
  const cancellationRate = pct(cancelled, bookings);
  const reviewRate = pct(reviewed, completed);
  const activeShare = pct(activeExperts.length, verifiedExperts);
  const bookableShare = pct(bookableExperts, verifiedExperts);
  const avgOrder = revenue._count._all
    ? Math.round((revenue._sum.amountSar ?? 0) / revenue._count._all)
    : 0;
  const rating = Number((ratingAgg._avg.ratingAvg ?? 0).toFixed(2));

  return [
    {
      key: "conversion",
      label: "تحوّل الطلب إلى حجز",
      value: `${requestConversion}٪`,
      target: "≥ ٢٥٪",
      health: grade(requestConversion, 25, 12),
      hint: "من كتب مشكلته ثم حجز فعلًا. أهم مؤشر: يقيس هل الترشيحات مقنعة.",
    },
    {
      key: "acceptance",
      label: "قبول الخبراء للطلبات",
      value: `${acceptanceRate}٪`,
      target: "≥ ٨٠٪",
      health: grade(acceptanceRate, 80, 60),
      hint: "الرفض المتكرر يعني أن المطابقة ترسل الطلب لغير أهله.",
    },
    {
      key: "response",
      label: "وسيط زمن الرد على الطلب",
      value: formatHours(medianResponse),
      target: "≤ ١٢ ساعة",
      health: grade(medianResponse, 12, 24, false),
      hint: "العميل الذي ينتظر ردًا يومين يذهب لغيرنا.",
    },
    {
      key: "completion",
      label: "إتمام الاستشارات المؤكدة",
      value: `${completionRate}٪`,
      target: "≥ ٩٠٪",
      health: grade(completionRate, 90, 75),
      hint: "الحجوزات المؤكدة التي تمت فعلًا ولم تُلغَ.",
    },
    {
      key: "cancellation",
      label: "نسبة الإلغاء",
      value: `${cancellationRate}٪`,
      target: "≤ ١٠٪",
      health: grade(cancellationRate, 10, 20, false),
      hint: "الارتفاع يشير إلى توقعات غير مضبوطة قبل الحجز.",
    },
    {
      key: "review",
      label: "تقييم بعد الاستشارة",
      value: `${reviewRate}٪`,
      target: "≥ ٦٠٪",
      health: grade(reviewRate, 60, 35),
      hint: "التقييمات هي ما يبني الثقة للعميل التالي.",
    },
    {
      key: "rating",
      label: "متوسط التقييم",
      value: rating.toFixed(2),
      target: "≥ ٤٫٥",
      health: grade(rating, 4.5, 4),
      hint: "جودة الاستشارات كما يراها العملاء.",
    },
    {
      key: "active-experts",
      label: "الخبراء النشطون",
      value: `${activeShare}٪`,
      target: "≥ ٤٠٪",
      health: grade(activeShare, 40, 20),
      hint: "من استقبل طلبًا خلال ٣٠ يومًا. المنخفض يعني خبراء بلا عمل.",
    },
    {
      key: "bookable",
      label: "جاهزية الخبراء للحجز",
      value: `${bookableShare}٪`,
      target: "≥ ٩٠٪",
      health: grade(bookableShare, 90, 70),
      hint: "من لديه خدمة فعّالة وأوقات توفر. غيرهم لا يمكن حجزه أصلًا.",
    },
    {
      key: "aov",
      label: "متوسط قيمة الاستشارة",
      value: `${avgOrder.toLocaleString("ar-SA-u-nu-latn")} ريال`,
      target: "≥ ٦٠٠ ريال",
      health: grade(avgOrder, 600, 400),
      hint: "يحدد جدوى العمولة ويعكس مستوى الخبرة المطلوبة.",
    },
    {
      key: "pending",
      label: "ملفات تنتظر التوثيق",
      value: String(pendingVerification),
      target: "≤ ٥",
      health: grade(pendingVerification, 5, 15, false),
      hint: "التراكم يعني خبراء ينتظرون ولا يستطيعون العمل.",
    },
  ];
}
