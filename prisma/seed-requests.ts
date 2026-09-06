import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { HeuristicAiProvider } from "../src/lib/ai/heuristic-provider";
import { normalizeArabic } from "../src/lib/ai/lexicon";

/**
 * Additive seed: inserts consultation briefs only, so it can be re-run on a live
 * database without touching users, bookings, or anything else already there.
 *
 * Briefs are produced by the offline engine on purpose — the seed must succeed
 * with no API key and no network, and the demand pulse needs real rows either way.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const engine = new HeuristicAiProvider();

/** A stable id so the demo always has a link that works, even offline. */
const DEMO_REQUEST_ID = "demo-supply-chain";

const PROBLEMS: { id?: string; text: string; daysAgo: number }[] = [
  {
    id: DEMO_REQUEST_ID,
    daysAgo: 0,
    text: "ارتفعت تكلفة التوزيع عندنا ٢٢٪ خلال ستة أشهر وما نعرف السبب. عندنا ثلاثة مستودعات في الرياض وجدة والدمام، ونشحن يوميًا حوالي ٤٠٠ طلب لعملاء تجزئة، والمخزون يتكدس في مستودع جدة بينما ينفد في الدمام.",
  },
  {
    daysAgo: 2,
    text: "شركتنا فيها ٦٠ موظفًا، وخلال السنة الماضية استقال ١٤ منهم أغلبهم من قسم المبيعات. الرواتب قريبة من السوق لكن ما عندنا وصف وظيفي واضح ولا مسار ترقيات، وأخشى أن نفقد بقية الفريق.",
  },
  {
    daysAgo: 3,
    text: "مشروع إنشائي عندنا متأخر سبعة أشهر عن الجدول الزمني، والمقاول يطالب بتمديد المدة وتكاليف إضافية. نسبة الإنجاز الفعلية ٥٥٪ مقابل ٨٥٪ مخطط، وما أعرف هل أستمر معه أو أنهي العقد.",
  },
  {
    daysAgo: 5,
    text: "التدفق النقدي عندنا متعثر رغم أن المبيعات ممتازة. نبيع بالآجل ٩٠ يومًا ونشتري نقدًا، وصار عندنا التزامات رواتب ومورّدين متأخرة. أحتاج من يساعدني في إعادة ترتيب الدورة المالية.",
  },
  {
    daysAgo: 6,
    text: "وصلتنا رسائل تصيّد على بريد الموظفين وأحدهم فتح ملفًا مشبوهًا. ما عندنا سياسة أمن معلومات ولا نسخ احتياطية مجدولة، ونتعامل مع بيانات عملاء حساسة. أحتاج تقييمًا سريعًا للمخاطر.",
  },
  {
    daysAgo: 8,
    text: "ننفق شهريًا ٤٠ ألف ريال على إعلانات وسائل التواصل، والتفاعل عالي لكن المبيعات ما تحركت. ما نعرف من هو عميلنا المثالي بالضبط، ولا أي قناة تجيب لنا عملاء يدفعون فعلًا.",
  },
  {
    daysAgo: 10,
    text: "عندنا مصنع مواد بناء، ونسبة التوقف غير المخطط وصلت ١٨٪ من ساعات التشغيل بسبب أعطال متكررة في خط الإنتاج الرئيسي. الصيانة عندنا رد فعل فقط، وما عندنا برنامج صيانة وقائية.",
  },
  {
    daysAgo: 12,
    text: "نريد الحصول على شهادة الأيزو ٩٠٠١ خلال ستة أشهر. الإجراءات عندنا غير موثقة، ونسبة شكاوى العملاء ارتفعت إلى ٧٪ من الطلبات، ولا يوجد تدقيق داخلي.",
  },
  {
    daysAgo: 14,
    text: "شريكي في الشركة يريد الخروج ويطالب بتقييم مبالغ فيه، وعقد التأسيس قديم ولا ينص على آلية واضحة للخروج أو تقييم الحصص. أحتاج رأيًا قانونيًا قبل أي تفاوض.",
  },
  {
    daysAgo: 16,
    text: "عندنا عيادة أسنان فيها ثلاث كراسي، ومعدل إشغال المواعيد ٤٥٪ فقط رغم كثرة الاتصالات. مطالباتنا التأمينية يُرفض منها ثلث تقريبًا، وما نعرف أين الخلل بالضبط.",
  },
];

async function main() {
  const categories = await db.category.findMany({ select: { id: true, name: true, slug: true } });
  if (categories.length === 0) {
    throw new Error("لا توجد تصنيفات — شغّل npm run db:seed أولًا");
  }

  // Median hourly price per category, mirroring src/server/matching.ts.
  const services = await db.consultingService.findMany({
    where: { isActive: true },
    select: {
      priceSar: true,
      durationMinutes: true,
      expertProfile: { select: { categories: { select: { category: { select: { slug: true } } } } } },
    },
  });

  const buckets = new Map<string, number[]>();
  for (const service of services) {
    if (service.durationMinutes <= 0) continue;
    const hourly = Math.round((service.priceSar / service.durationMinutes) * 60);
    for (const link of service.expertProfile.categories) {
      const list = buckets.get(link.category.slug) ?? [];
      list.push(hourly);
      buckets.set(link.category.slug, list);
    }
  }

  const priceHints: Record<string, number> = {};
  for (const [slug, prices] of buckets) {
    prices.sort((a, b) => a - b);
    priceHints[slug] = prices[Math.floor(prices.length / 2)];
  }

  const clients = await db.user.findMany({ where: { role: "CLIENT" }, select: { id: true } });

  let created = 0;
  for (const [index, problem] of PROBLEMS.entries()) {
    const brief = await engine.analyzeProblem({ text: problem.text, categories, priceHints });
    const category = categories.find((item) => item.slug === brief.categorySlug) ?? null;

    const data = {
      // Attach most briefs to a real client; leave a couple as anonymous visitors.
      clientId: index % 4 === 3 ? null : (clients[index % clients.length]?.id ?? null),
      rawText: problem.text,
      textHash: createHash("sha256").update(normalizeArabic(problem.text)).digest("hex"),
      categoryId: category?.id ?? null,
      reframedQuestion: brief.reframedQuestion,
      keySkills: brief.keySkills,
      questionsToAsk: brief.questionsToAsk,
      suggestedMinutes: brief.suggestedMinutes,
      budgetMinSar: brief.budgetMinSar,
      budgetMaxSar: brief.budgetMaxSar,
      engine: "heuristic",
      createdAt: new Date(Date.now() - problem.daysAgo * 24 * 60 * 60 * 1000),
    };

    if (problem.id) {
      await db.consultationRequest.upsert({
        where: { id: problem.id },
        update: data,
        create: { id: problem.id, ...data },
      });
    } else {
      const existing = await db.consultationRequest.findFirst({
        where: { textHash: data.textHash },
        select: { id: true },
      });
      if (existing) continue;
      await db.consultationRequest.create({ data });
    }
    created += 1;
  }

  const total = await db.consultationRequest.count();
  console.log(`تمت إضافة/تحديث ${created} طلب استشارة — الإجمالي الآن ${total}`);
  console.log(`رابط الديمو الثابت: /match/${DEMO_REQUEST_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
