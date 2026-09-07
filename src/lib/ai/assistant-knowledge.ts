import { normalizeArabic } from "./lexicon";

/**
 * What the assistant is allowed to know about the platform, and the canned
 * answers the offline engine falls back to. Every entry carries a link so an
 * answer always ends somewhere the user can act, never at a dead end.
 */
export type HelpEntry = {
  keywords: string[];
  answer: string;
  href?: string;
  linkLabel?: string;
  /** Which roles this answer is relevant to; omitted means everyone. */
  roles?: ("EXPERT" | "CLIENT" | "ADMIN")[];
};

export const HELP_ENTRIES: HelpEntry[] = [
  {
    keywords: ["احجز", "حجز", "استشاره", "موعد", "كيف اطلب"],
    answer:
      "اكتب مشكلتك في الصفحة الرئيسية، فنرشّح لك ثلاثة خبراء مع سبب اختيار كل واحد. تختار الخبير، ثم الموعد من أوقاته المتاحة، وتدفع — ويصلك تأكيد وتُفتح محادثة معه.",
    href: "/",
    linkLabel: "ابدأ من هنا",
    roles: ["CLIENT"],
  },
  {
    keywords: ["الغاء", "الغي", "استرداد", "استرجاع", "فلوسي"],
    answer:
      "تقدر تلغي الحجز من صفحة تفاصيل الاستشارة ما دام لم يبدأ موعده. الحجوزات في هذا النموذج التجريبي تستخدم دفعًا تجريبيًا، فلا تُخصم مبالغ حقيقية.",
    href: "/dashboard/client/consultations",
    linkLabel: "استشاراتي",
    roles: ["CLIENT"],
  },
  {
    keywords: ["موثق", "توثيق", "معتمد", "ثقه", "اطمن"],
    answer:
      "كل خبير يمر بمراجعة من فريق المنصة قبل الظهور: نتحقق من مسيرته المهنية وشهاداته. الخبير الموثّق تظهر بجانب اسمه علامة زرقاء، ولا يظهر في نتائج البحث إلا الموثّقون.",
    href: "/experts",
    linkLabel: "تصفّح الخبراء",
  },
  {
    keywords: ["ملفي", "ملف", "لم يعتمد", "مرفوض", "قيد المراجعه", "توثيق ملفي"],
    answer:
      "حالة ملفك تظهر أعلى لوحتك. إن كان «قيد المراجعة» فالفريق يطّلع عليه، وإن كان «غير معتمد» فستجد سبب الرفض مكتوبًا لتعالجه وتعيد الإرسال.",
    href: "/dashboard/expert/profile",
    linkLabel: "ملفي المهني",
    roles: ["EXPERT"],
  },
  {
    keywords: ["خدمه", "خدمات", "سعر", "اسعار", "اضيف خدمه", "تسعير"],
    answer:
      "من صفحة «خدماتي» تضيف خدمة استشارية باسم ووصف ومدة وسعر. تقدر تضيف أكثر من خدمة بمدد مختلفة، وتفعّل أو توقف أي واحدة متى شئت.",
    href: "/dashboard/expert/services",
    linkLabel: "خدماتي",
    roles: ["EXPERT"],
  },
  {
    keywords: ["اوقات", "توفر", "متاح", "جدول", "مواعيدي"],
    answer:
      "أوقات توفرك تُضبط من بنّاء الملف المهني: تختار أيام الأسبوع وساعات كل يوم. المنصة تقسّمها تلقائيًا إلى مواعيد بحسب مدة كل خدمة، وتخفي المحجوز منها.",
    href: "/dashboard/expert/profile",
    linkLabel: "أوقات التوفر",
    roles: ["EXPERT"],
  },
  {
    keywords: ["ارباح", "دخل", "فلوس", "كم كسبت", "مستحقات"],
    answer:
      "صفحة الأرباح تعرض إجمالي دخلك وأرباح الشهر الحالي ورسمًا بيانيًا شهريًا وقائمة تفصيلية بكل استشارة مكتملة.",
    href: "/dashboard/expert/earnings",
    linkLabel: "أرباحي",
    roles: ["EXPERT"],
  },
  {
    keywords: ["رساله", "محادثه", "اتواصل", "شات", "مراسله"],
    answer:
      "تُفتح محادثة تلقائيًا بينك وبين الطرف الآخر بمجرد تأكيد الحجز. تجدها في صفحة الرسائل وأيضًا داخل صفحة الحجز نفسه.",
    href: "/dashboard/client/messages",
    linkLabel: "الرسائل",
  },
  {
    keywords: ["تقييم", "اقيم", "نجوم", "رايي"],
    answer:
      "بعد انتهاء موعد الاستشارة يظهر لك نموذج التقييم في صفحة الحجز: تختار عدد النجوم وتكتب تعليقك، ويُحدَّث تقييم الخبير مباشرة.",
    roles: ["CLIENT"],
  },
  {
    keywords: ["نفاذ", "الدخول عبر نفاذ", "الهويه"],
    answer:
      "زر «الدخول عبر نفاذ» في هذا النموذج تجريبي: يدخلك بحساب خبير جاهز ليوضّح كيف سيبدو التكامل مع النفاذ الوطني الموحّد مستقبلًا، ولا يتصل بأي جهة حقيقية.",
    href: "/auth/login",
    linkLabel: "تسجيل الدخول",
  },
  {
    keywords: ["دفع", "بطاقه", "مدى", "ابل باي", "فاتوره"],
    answer:
      "الدفع في هذا النموذج تجريبي بالكامل — لا تتحرك أي مبالغ ولا تُستدعى بوابة دفع. تقدر تجرّب مدى أو Apple Pay أو البطاقة لترى المسار كاملًا.",
    href: "/dashboard/client/payments",
    linkLabel: "مدفوعاتي",
    roles: ["CLIENT"],
  },
  {
    keywords: ["توثيق الخبراء", "طلبات معلقه", "مراجعه", "اعتماد"],
    answer:
      "طلبات التوثيق المعلّقة تظهر في لوحة الإدارة، ومنها تفتح ملف الخبير كاملًا فتعتمده أو ترفضه مع كتابة السبب — ويصل الخبير إشعار بالنتيجة.",
    href: "/admin/experts",
    linkLabel: "مراجعة الخبراء",
    roles: ["ADMIN"],
  },
  {
    keywords: ["دعم", "تواصل", "مساعده", "شكوى", "مشكله بالموقع"],
    answer:
      "تقدر تتواصل مع الدعم عبر القنوات المذكورة أسفل الصفحة: واتساب، إكس، إنستقرام، والبريد. أوقات العمل الأحد إلى الخميس من ٩ صباحًا إلى ٥ مساءً.",
  },
];

/** The platform facts handed to the model as system context. */
export const PLATFORM_BRIEF = `منصة «خبير» تربط المتقاعدين أصحاب الخبرة الطويلة بالمنشآت والأفراد الذين يحتاجون استشارة مدفوعة.

الأدوار: خبير (متقاعد يعرض خدماته الاستشارية) · عميل (شركة أو فرد يطلب استشارة) · مشرف (فريق المنصة).

كيف تبدأ الاستشارة: العميل يكتب مشكلته بلغته العادية، فيحوّلها الذكاء الاصطناعي إلى ملخص استشاري ويرشّح ثلاثة خبراء موثّقين مع سبب لكل ترشيح. ثم يختار موعدًا من أوقات توفر الخبير ويدفع، فيُنشأ حجز وتُفتح محادثة.

حالات الحجز: بانتظار الرد ← مؤكد أو مرفوض أو ملغى ← مكتمل بعد مرور الموعد.

التوثيق: لا يظهر الخبير في نتائج البحث إلا بعد مراجعة فريق المنصة لملفه.

الدفع ونفاذ في هذا النموذج تجريبيان ولا يتصلان بأي جهة حقيقية.`;

/** Offline matcher: picks the closest canned answer for a question. */
export function findHelpEntry(question: string, role?: string): HelpEntry | null {
  const q = normalizeArabic(question);
  let best: { entry: HelpEntry; score: number } | null = null;

  for (const entry of HELP_ENTRIES) {
    if (entry.roles && role && !entry.roles.includes(role as "EXPERT")) continue;
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(normalizeArabic(keyword))) score += keyword.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  return best?.entry ?? null;
}
