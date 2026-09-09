import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { VOUCHERS, currentBadge } from "../src/lib/rewards";

/**
 * Deepens the completed-consultation history.
 *
 * The rewards ladder starts at 3 completed consultations, but the busiest expert
 * had 2 — so every tier looked unreachable and the feature read as decorative.
 * This backfills past consultations (with payments, conversations and reviews)
 * so a handful of experts sit at each rung and the ladder is legible at a glance.
 *
 * Additive and re-runnable: it tops experts up to a target, never past it.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const db = new PrismaClient({ adapter });

const DAY = 24 * 60 * 60 * 1000;

/** How many completed consultations the top experts should end up with. */
const TARGETS = [32, 27, 16, 12, 11, 8, 8, 6, 5, 5, 4, 4, 3, 3];

const DESCRIPTIONS = [
  "راجعنا الأرقام داخليًا مرتين ولم نصل إلى سبب واضح، ونريد قراءة من خارج الفريق.",
  "نحتاج ترتيب أولويات الخطة والتأكد من واقعية الجدول الزمني قبل اعتمادها.",
  "الفريق منقسم بين خيارين ونريد رأي من مرّ بهذا الموقف عمليًا.",
  "نبحث عن تحديد أهم ثلاث خطوات نبدأ بها خلال الشهر القادم.",
  "التكاليف ارتفعت دون تفسير في التقارير الداخلية، ونريد قراءة مختلفة للأرقام.",
];

const REVIEWS = [
  { rating: 5, comment: "تشخيص دقيق من أول جلسة، وخطوات قابلة للتنفيذ لا كلام عام." },
  { rating: 5, comment: "الأسئلة التي طرحها كشفت لي جوانب لم أنتبه لها إطلاقًا." },
  { rating: 4, comment: "استشارة منظمة ومفيدة، وكنت أتمنى وقتًا أطول." },
  { rating: 5, comment: "خبرته الميدانية ظاهرة في طريقة تحليله. أوصي به بشدة." },
  { rating: 4, comment: "رأي صادق ولم يجاملني في نقاط توقعت أن يجاملني فيها." },
];

function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

async function main() {
  const random = makeRandom(20260909);

  const experts = await db.expertProfile.findMany({
    where: { verificationStatus: "VERIFIED" },
    orderBy: { ratingAvg: "desc" },
    select: {
      userId: true,
      user: { select: { name: true } },
      services: { where: { isActive: true }, select: { id: true, name: true, durationMinutes: true, priceSar: true } },
    },
  });

  const clients = await db.user.findMany({ where: { role: "CLIENT" }, select: { id: true } });
  if (clients.length === 0) throw new Error("لا يوجد عملاء — شغّل npm run db:seed أولًا");

  let created = 0;
  let reviewed = 0;

  for (const [index, expert] of experts.entries()) {
    const target = TARGETS[index];
    if (!target || expert.services.length === 0) continue;

    const already = await db.booking.count({
      where: { expertId: expert.userId, status: "COMPLETED" },
    });
    const missing = target - already;
    if (missing <= 0) continue;

    for (let i = 0; i < missing; i += 1) {
      const client = clients[Math.floor(random() * clients.length)];
      if (client.id === expert.userId) continue;
      const service = expert.services[Math.floor(random() * expert.services.length)];

      // Spread the history over the past year so the earnings chart looks real.
      const daysAgo = 10 + Math.floor(random() * 350);
      const scheduledAt = new Date(Date.now() - daysAgo * DAY);
      scheduledAt.setHours(9 + Math.floor(random() * 8), random() > 0.5 ? 30 : 0, 0, 0);

      const suffix = randomBytes(4).toString("hex").toUpperCase();

      const booking = await db.booking.create({
        data: {
          bookingRef: `KHB-${suffix}`,
          clientId: client.id,
          expertId: expert.userId,
          serviceId: service.id,
          scheduledAt,
          durationMinutes: service.durationMinutes,
          priceSar: service.priceSar,
          description: DESCRIPTIONS[Math.floor(random() * DESCRIPTIONS.length)],
          status: "COMPLETED",
          completedAt: scheduledAt,
          createdAt: new Date(scheduledAt.getTime() - 5 * DAY),
          payment: {
            create: {
              amountSar: service.priceSar,
              method: ["MADA", "APPLE_PAY", "CARD"][Math.floor(random() * 3)],
              status: "PAID",
              transactionRef: `TXN-${suffix}`,
              provider: "mock",
              cardLast4: String(1000 + Math.floor(random() * 8999)).slice(-4),
            },
          },
          conversation: {
            create: {
              clientId: client.id,
              expertId: expert.userId,
              lastMessageAt: new Date(scheduledAt.getTime() - DAY),
              messages: {
                create: [
                  {
                    senderId: client.id,
                    body: "السلام عليكم، أرفقت التفاصيل في وصف الحجز. هل تحتاج أرقامًا إضافية قبل الموعد؟",
                    createdAt: new Date(scheduledAt.getTime() - DAY - 3600_000),
                    readAt: new Date(scheduledAt.getTime() - DAY),
                  },
                  {
                    senderId: expert.userId,
                    body: "وعليكم السلام. اطّلعت عليها، ويكفي أن تجهّز أرقام آخر ستة أشهر.",
                    createdAt: new Date(scheduledAt.getTime() - DAY),
                    readAt: new Date(scheduledAt.getTime() - DAY),
                  },
                ],
              },
            },
          },
        },
        select: { id: true },
      });
      created += 1;

      // Roughly seven in ten completed consultations get a review.
      if (random() > 0.3) {
        const pick = REVIEWS[Math.floor(random() * REVIEWS.length)];
        await db.review.create({
          data: {
            bookingId: booking.id,
            clientId: client.id,
            expertId: expert.userId,
            rating: pick.rating,
            comment: pick.comment,
            createdAt: new Date(scheduledAt.getTime() + DAY),
          },
        });
        reviewed += 1;
      }
    }
  }

  // Ratings and the completed counter must match the new history.
  let vouchers = 0;
  const ladder: Record<string, number> = {};

  for (const expert of experts) {
    const [aggregate, completed] = await Promise.all([
      db.review.aggregate({
        where: { expertId: expert.userId, isHidden: false },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      db.booking.count({ where: { expertId: expert.userId, status: "COMPLETED" } }),
    ]);

    await db.expertProfile.update({
      where: { userId: expert.userId },
      data: {
        ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
        ratingCount: aggregate._count.rating,
        completedConsultations: completed,
      },
    });

    const badge = currentBadge(completed);
    if (badge) ladder[badge.name] = (ladder[badge.name] ?? 0) + 1;

    for (const tier of VOUCHERS) {
      if (completed < tier.threshold) continue;
      const exists = await db.rewardVoucher.findFirst({
        where: { expertId: expert.userId, tierKey: tier.key },
        select: { id: true },
      });
      if (exists) continue;

      await db.rewardVoucher.create({
        data: {
          expertId: expert.userId,
          tierKey: tier.key,
          partner: tier.partner,
          valueSar: tier.valueSar,
          code: `KHB-${tier.key.split("-")[0].toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`,
        },
      });
      vouchers += 1;
    }
  }

  console.log({
    استشارات_مضافة: created,
    تقييمات_مضافة: reviewed,
    قسائم_ممنوحة: vouchers,
    الأوسمة: ladder,
    إجمالي_المكتملة: await db.booking.count({ where: { status: "COMPLETED" } }),
    إجمالي_التقييمات: await db.review.count(),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
