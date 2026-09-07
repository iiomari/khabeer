import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Additive seed for the demand side of the marketplace.
 *
 * The roster had 23 experts against 5 clients and 6 reviews, so the platform
 * looked supply-heavy and under-used. This adds clients, bookings across every
 * status, reviews, conversations and favourites — then recomputes each expert's
 * rating so the numbers on their profiles stay truthful.
 *
 * Re-runnable: clients are keyed by email and skipped if they already exist.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Khabeer@123";
const DAY = 24 * 60 * 60 * 1000;

type ClientSeed = {
  email: string;
  name: string;
  phone: string;
  city: string;
  isCompany: boolean;
  companyName?: string;
  industry?: string;
};

const CLIENTS: ClientSeed[] = [
  { email: "noura@tamkeen-retail.sa", name: "نورة بنت سليمان الحمد", phone: "0552000001", city: "الرياض", isCompany: true, companyName: "تمكين للتجزئة", industry: "تجزئة" },
  { email: "faisal@rawabi-food.sa", name: "فيصل بن عمر البلوي", phone: "0552000002", city: "جدة", isCompany: true, companyName: "روابي للأغذية", industry: "أغذية" },
  { email: "sara@mabani-contracting.sa", name: "سارة بنت أحمد الغامدي", phone: "0552000003", city: "الدمام", isCompany: true, companyName: "مباني للمقاولات", industry: "مقاولات" },
  { email: "khalid@noor-clinics.sa", name: "خالد بن راشد المطيري", phone: "0552000004", city: "الرياض", isCompany: true, companyName: "عيادات نور", industry: "رعاية صحية" },
  { email: "mona@hirfah.sa", name: "منى بنت عبدالله الشهري", phone: "0552000005", city: "أبها", isCompany: true, companyName: "حِرفة للتصنيع", industry: "تصنيع" },
  { email: "abdulaziz@sanad-logistics.sa", name: "عبدالعزيز بن فهد القرني", phone: "0552000006", city: "الدمام", isCompany: true, companyName: "سند للخدمات اللوجستية", industry: "لوجستيات" },
  { email: "lama@thara-academy.sa", name: "لمى بنت وليد العمري", phone: "0552000007", city: "الرياض", isCompany: true, companyName: "أكاديمية ثراء", industry: "تدريب" },
  { email: "yousef.freelance@gmail.com", name: "يوسف بن ماجد الدوسري", phone: "0552000008", city: "الخبر", isCompany: false },
  { email: "aisha.founder@gmail.com", name: "عائشة بنت طارق الزهراني", phone: "0552000009", city: "جدة", isCompany: false },
  { email: "turki.startup@gmail.com", name: "تركي بن نايف العتيبي", phone: "0552000010", city: "الرياض", isCompany: false },
];

/** Booking descriptions, written to read like real briefs rather than filler. */
const DESCRIPTIONS = [
  "نحتاج رأيًا محايدًا قبل اتخاذ قرار التوسع في فرع جديد، وعندنا أرقام المبيعات لآخر سنتين جاهزة للمراجعة.",
  "المشكلة تتكرر كل ربع سنة ولم نصل إلى سببها الجذري رغم محاولتين داخليتين، ونريد تشخيصًا من خارج الفريق.",
  "لدينا خطة مكتوبة لكننا غير واثقين من ترتيب أولوياتها ولا من واقعية الجدول الزمني الموضوع لها.",
  "نبحث عن مراجعة سريعة للوضع الحالي وتحديد أهم ثلاث خطوات نبدأ بها خلال الشهر القادم.",
  "الفريق منقسم بين خيارين، ونحتاج من لديه تجربة عملية سابقة في هذا النوع من القرارات ليساعدنا في الحسم.",
  "التكاليف ارتفعت دون تفسير واضح من التقارير الداخلية، ونريد قراءة مختلفة للأرقام من خبير ميداني.",
];

const REVIEW_COMMENTS = [
  { rating: 5, comment: "خبرة عملية واضحة من أول دقيقة. أعطاني تشخيصًا محددًا وخطوات قابلة للتنفيذ، لا كلامًا عامًا." },
  { rating: 5, comment: "استفدت أكثر مما توقعت. الأسئلة التي طرحها كشفت لي جوانب لم أنتبه لها في مشكلتي." },
  { rating: 4, comment: "استشارة مفيدة ومنظمة. كنت أتمنى وقتًا أطول لتغطية بقية النقاط." },
  { rating: 5, comment: "سنوات خبرته ظاهرة في طريقة تحليله. أوصي به لأي منشأة تمر بنفس الموقف." },
  { rating: 4, comment: "رأي مهني صادق، ولم يجاملني في نقاط كنت أتوقع أن يجاملني فيها. هذا ما كنت أحتاجه." },
  { rating: 5, comment: "وضع لي خارطة طريق واضحة لثلاثة أشهر، وتابع معي عبر المحادثة بعد انتهاء الموعد." },
];

/** Deterministic pseudo-random so repeated runs produce a stable dataset. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function ref(prefix: string, n: number) {
  return `${prefix}-${n.toString(36).toUpperCase().padStart(6, "0")}`;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const random = makeRandom(20260907);

  // ── clients ────────────────────────────────────────────────────────────
  let newClients = 0;
  for (const seed of CLIENTS) {
    const existing = await db.user.findUnique({ where: { email: seed.email }, select: { id: true } });
    if (existing) continue;

    await db.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        passwordHash,
        role: "CLIENT",
        phone: seed.phone,
        city: seed.city,
        clientProfile: {
          create: {
            isCompany: seed.isCompany,
            companyName: seed.companyName ?? null,
            industry: seed.industry ?? null,
          },
        },
      },
    });
    newClients += 1;
  }

  // ── bookings, payments, conversations, reviews ─────────────────────────
  const clients = await db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true } });
  const services = await db.consultingService.findMany({
    where: { isActive: true, expertProfile: { verificationStatus: "VERIFIED" } },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceSar: true,
      expertProfile: { select: { userId: true } },
    },
  });

  if (services.length === 0) throw new Error("لا توجد خدمات — شغّل npm run db:seed أولًا");

  const existingBookings = await db.booking.count();
  const target = 44; // a marketplace that looks used, without drowning the admin tables
  const toCreate = Math.max(0, target - existingBookings);

  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "CONFIRMED", "CONFIRMED", "PENDING", "CANCELLED", "REJECTED"];
  let made = 0;
  let reviewed = 0;

  for (let i = 0; i < toCreate; i += 1) {
    const client = clients[Math.floor(random() * clients.length)];
    const service = services[Math.floor(random() * services.length)];
    const expertId = service.expertProfile.userId;
    if (expertId === client.id) continue;

    const status = statuses[Math.floor(random() * statuses.length)];
    const isPast = status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED";
    const offsetDays = Math.floor(random() * 60) + 1;
    const scheduledAt = new Date(Date.now() + (isPast ? -offsetDays : offsetDays) * DAY);
    scheduledAt.setHours(9 + Math.floor(random() * 8), random() > 0.5 ? 30 : 0, 0, 0);

    const n = existingBookings + i + 1;
    const paid = status !== "REJECTED";

    const booking = await db.booking.create({
      data: {
        bookingRef: ref("KHB", n * 7919),
        clientId: client.id,
        expertId,
        serviceId: service.id,
        scheduledAt,
        durationMinutes: service.durationMinutes,
        priceSar: service.priceSar,
        description: DESCRIPTIONS[Math.floor(random() * DESCRIPTIONS.length)],
        status,
        statusReason: status === "REJECTED" ? "الموعد المطلوب يتعارض مع ارتباط سابق." : null,
        completedAt: status === "COMPLETED" ? scheduledAt : null,
        createdAt: new Date(scheduledAt.getTime() - (3 + Math.floor(random() * 10)) * DAY),
        ...(paid
          ? {
              payment: {
                create: {
                  amountSar: service.priceSar,
                  method: ["MADA", "APPLE_PAY", "CARD"][Math.floor(random() * 3)],
                  status: status === "CANCELLED" ? "REFUNDED" : "PAID",
                  transactionRef: ref("TXN", n * 104729),
                  provider: "mock",
                  cardLast4: String(1000 + Math.floor(random() * 8999)).slice(-4),
                },
              },
            }
          : {}),
      },
      select: { id: true, clientId: true, expertId: true, scheduledAt: true },
    });
    made += 1;

    // Confirmed and completed bookings have an open conversation.
    if (status === "COMPLETED" || status === "CONFIRMED") {
      const lastMessageAt = new Date(booking.scheduledAt.getTime() - DAY);
      await db.conversation.create({
        data: {
          bookingId: booking.id,
          clientId: booking.clientId,
          expertId: booking.expertId,
          lastMessageAt,
          messages: {
            create: [
              {
                senderId: booking.clientId,
                body: "السلام عليكم، أرفقت تفاصيل الحالة في وصف الحجز. هل تحتاج أي أرقام إضافية قبل الموعد؟",
                createdAt: new Date(lastMessageAt.getTime() - 3600_000),
                readAt: lastMessageAt,
              },
              {
                senderId: booking.expertId,
                body: "وعليكم السلام. اطّلعت على الوصف، وأرجو أن تجهّز أرقام آخر ستة أشهر لنبني عليها في المكالمة.",
                createdAt: lastMessageAt,
                readAt: status === "COMPLETED" ? lastMessageAt : null,
              },
            ],
          },
        },
      });
    }

    // Most completed consultations get reviewed.
    if (status === "COMPLETED" && random() > 0.25) {
      const pick = REVIEW_COMMENTS[Math.floor(random() * REVIEW_COMMENTS.length)];
      await db.review.create({
        data: {
          bookingId: booking.id,
          clientId: booking.clientId,
          expertId: booking.expertId,
          rating: pick.rating,
          comment: pick.comment,
          createdAt: new Date(booking.scheduledAt.getTime() + DAY),
        },
      });
      reviewed += 1;
    }
  }

  // ── favourites ─────────────────────────────────────────────────────────
  const expertIds = [...new Set(services.map((s) => s.expertProfile.userId))];
  let favourites = 0;
  for (const client of clients) {
    for (let i = 0; i < 2; i += 1) {
      const expertId = expertIds[Math.floor(random() * expertIds.length)];
      const exists = await db.favorite.findFirst({
        where: { clientId: client.id, expertId },
        select: { id: true },
      });
      if (exists) continue;
      await db.favorite.create({ data: { clientId: client.id, expertId } });
      favourites += 1;
    }
  }

  // ── keep the published ratings honest ──────────────────────────────────
  for (const expertId of expertIds) {
    const aggregate = await db.review.aggregate({
      where: { expertId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const completed = await db.booking.count({ where: { expertId, status: "COMPLETED" } });
    await db.expertProfile.update({
      where: { userId: expertId },
      data: {
        ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
        ratingCount: aggregate._count.rating,
        completedConsultations: completed,
      },
    });
  }

  const totals = {
    عملاء_جدد: newClients,
    حجوزات_جديدة: made,
    تقييمات_جديدة: reviewed,
    مفضلات_جديدة: favourites,
    إجمالي_المستخدمين: await db.user.count(),
    إجمالي_الحجوزات: await db.booking.count(),
    إجمالي_التقييمات: await db.review.count(),
  };
  console.log(totals);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
