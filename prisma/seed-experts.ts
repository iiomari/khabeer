import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Additive seed: fills out the fields the platform is actually asked about.
 *
 * The first roster had one expert in most categories, which meant a supply-chain
 * problem got one relevant match and two from unrelated fields. Matching quality is
 * bounded by roster depth, so the demo fields get three to four experts each.
 * Re-runnable: existing emails are skipped.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Khabeer@123";

const WEEK_AVAILABILITY = [
  { dayOfWeek: 0, startMinute: 600, endMinute: 840 },
  { dayOfWeek: 1, startMinute: 600, endMinute: 840 },
  { dayOfWeek: 2, startMinute: 960, endMinute: 1200 },
  { dayOfWeek: 3, startMinute: 600, endMinute: 840 },
  { dayOfWeek: 4, startMinute: 960, endMinute: 1140 },
];

type ExpertSeed = {
  email: string;
  name: string;
  phone: string;
  city: string;
  headline: string;
  bio: string;
  previousTitle: string;
  previousOrganization: string;
  years: number;
  rating: number;
  ratingCount: number;
  completed: number;
  categories: string[];
  skills: string[];
  experiences: { organization: string; position: string; startYear: number; endYear?: number; description: string }[];
  educations: { institution: string; degree: string; field: string; graduationYear: number }[];
  certifications: { name: string; issuer: string; issueYear: number }[];
  services: { name: string; description: string; durationMinutes: number; priceSar: number }[];
};

const EXPERTS: ExpertSeed[] = [
  // ── سلاسل الإمداد ──────────────────────────────────────────────
  {
    email: "mansour.logistics@khabeer.sa",
    name: "منصور بن سعد الشمري",
    phone: "0551000021",
    city: "الدمام",
    headline: "مستشار لوجستيات — مدير التوزيع السابق في شركة الجزيرة للأغذية",
    bio: "قضيت ٢٧ عامًا في تشغيل شبكات التوزيع والمستودعات. أدرت أسطولًا من ١٤٠ مركبة وستة مستودعات إقليمية، وقدت مشروع إعادة تصميم شبكة التوزيع الذي خفض تكلفة التوصيل للطلب الواحد ١٩٪. أعمل اليوم مع المنشآت التي تعاني ارتفاع تكلفة النقل أو سوء توزيع المخزون بين الفروع.",
    previousTitle: "مدير التوزيع والنقل",
    previousOrganization: "شركة الجزيرة للأغذية",
    years: 27,
    rating: 4.8,
    ratingCount: 6,
    completed: 21,
    categories: ["supply-chain", "industry"],
    skills: ["تحسين شبكة التوزيع", "خفض تكلفة النقل", "إدارة الأساطيل", "توزيع المخزون بين الفروع", "مؤشرات الأداء اللوجستي"],
    experiences: [
      { organization: "شركة الجزيرة للأغذية", position: "مدير التوزيع والنقل", startYear: 2009, endYear: 2024, description: "تشغيل ستة مستودعات إقليمية وأسطول ١٤٠ مركبة، وإعادة تصميم شبكة التوزيع." },
      { organization: "مجموعة الرواد التجارية", position: "مدير مستودعات", startYear: 1998, endYear: 2009, description: "إدارة مستودعين مركزيين وتطبيق نظام إدارة مستودعات WMS." },
    ],
    educations: [{ institution: "جامعة الملك فهد للبترول والمعادن", degree: "بكالوريوس", field: "هندسة صناعية", graduationYear: 1996 }],
    certifications: [{ name: "CSCP — محترف سلاسل إمداد معتمد", issuer: "APICS", issueYear: 2012 }],
    services: [
      { name: "تشخيص ارتفاع تكلفة التوزيع", description: "جلسة نحلل فيها بنود تكلفة النقل والتخزين ونحدد أين تتسرب التكلفة فعليًا.", durationMinutes: 60, priceSar: 700 },
      { name: "مراجعة توزيع المخزون بين المستودعات", description: "معالجة تكدس المخزون في فرع ونفاده في آخر عبر إعادة ضبط نقاط إعادة الطلب.", durationMinutes: 45, priceSar: 500 },
    ],
  },
  {
    email: "hind.supply@khabeer.sa",
    name: "هند بنت عبدالرحمن القحطاني",
    phone: "0551000022",
    city: "الرياض",
    headline: "مستشارة تخطيط الطلب — مديرة التخطيط السابقة في مجموعة الوفاق للتجزئة",
    bio: "٢٢ عامًا في تخطيط الطلب وإدارة المخزون في قطاع التجزئة. بنيت نماذج تنبؤ خفضت المخزون الراكد ٣٤٪ مع رفع نسبة توفر الأصناف إلى ٩٦٪. أساعد المنشآت التي تشتري كثيرًا وتبيع ببطء، أو التي تنفد أصنافها الأكثر مبيعًا باستمرار.",
    previousTitle: "مديرة تخطيط الطلب والمخزون",
    previousOrganization: "مجموعة الوفاق للتجزئة",
    years: 22,
    rating: 4.9,
    ratingCount: 4,
    completed: 15,
    categories: ["supply-chain", "quality"],
    skills: ["تخطيط الطلب", "إدارة المخزون", "نقاط إعادة الطلب", "التنبؤ بالمبيعات", "تحليل الأصناف الراكدة"],
    experiences: [
      { organization: "مجموعة الوفاق للتجزئة", position: "مديرة تخطيط الطلب والمخزون", startYear: 2011, endYear: 2024, description: "بناء نظام التنبؤ بالطلب لأكثر من ٤٠٠٠ صنف عبر ٦٠ فرعًا." },
      { organization: "شركة نماء للتوريدات", position: "أخصائية مشتريات أولى", startYear: 2003, endYear: 2011, description: "إدارة محفظة موردين محليين ودوليين والتفاوض على عقود التوريد السنوية." },
    ],
    educations: [{ institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "إدارة عمليات", graduationYear: 2002 }],
    certifications: [{ name: "CPIM — إدارة الإنتاج والمخزون", issuer: "APICS", issueYear: 2010 }],
    services: [
      { name: "مراجعة سياسة المخزون", description: "ضبط نقاط إعادة الطلب والحد الأدنى لكل صنف بناءً على أنماط الطلب الفعلية.", durationMinutes: 60, priceSar: 650 },
      { name: "معالجة المخزون الراكد", description: "تحديد الأصناف الراكدة وخطة تصريفها دون إضرار بالهامش.", durationMinutes: 45, priceSar: 450 },
    ],
  },
  {
    email: "ibrahim.procure@khabeer.sa",
    name: "إبراهيم بن ناصر العنزي",
    phone: "0551000023",
    city: "جدة",
    headline: "مستشار مشتريات وتوريد — مدير المشتريات السابق في شركة البحر الأحمر للصناعات",
    bio: "٣٠ عامًا في المشتريات والتعاقد مع الموردين، منها ١٢ عامًا في التوريد الدولي والتخليص الجمركي. قدت برنامج ترشيد مشتريات وفّر ٢٣ مليون ريال خلال ثلاث سنوات. أساعد المنشآت في التفاوض مع الموردين وبناء عقود توريد تحميها من تقلبات الأسعار.",
    previousTitle: "مدير المشتريات",
    previousOrganization: "شركة البحر الأحمر للصناعات",
    years: 30,
    rating: 4.7,
    ratingCount: 5,
    completed: 18,
    categories: ["supply-chain", "finance"],
    skills: ["التفاوض مع الموردين", "عقود التوريد", "الاستيراد والتخليص الجمركي", "ترشيد المشتريات", "تقييم الموردين"],
    experiences: [
      { organization: "شركة البحر الأحمر للصناعات", position: "مدير المشتريات", startYear: 2006, endYear: 2023, description: "إدارة مشتريات سنوية تتجاوز ٤٠٠ مليون ريال وبناء برنامج تقييم الموردين." },
      { organization: "مصانع الخليج للبلاستيك", position: "رئيس قسم التوريد", startYear: 1995, endYear: 2006, description: "إدارة سلسلة التوريد الدولية وعمليات الاستيراد والتخليص." },
    ],
    educations: [{ institution: "جامعة الملك عبدالعزيز", degree: "بكالوريوس", field: "إدارة أعمال", graduationYear: 1993 }],
    certifications: [{ name: "CIPS — دبلوم المشتريات والتوريد", issuer: "CIPS", issueYear: 2008 }],
    services: [
      { name: "استراتيجية التفاوض مع الموردين", description: "تحضير موقفك التفاوضي قبل تجديد عقد توريد أو مواجهة رفع أسعار.", durationMinutes: 60, priceSar: 750 },
      { name: "مراجعة عقد توريد", description: "قراءة بنود عقد التوريد وتحديد المخاطر التجارية قبل التوقيع.", durationMinutes: 45, priceSar: 550 },
    ],
  },

  // ── الموارد البشرية ────────────────────────────────────────────
  {
    email: "salman.hr@khabeer.sa",
    name: "سلمان بن خالد العتيبي",
    phone: "0551000024",
    city: "الرياض",
    headline: "مستشار موارد بشرية — مدير عام الموارد البشرية السابق في مجموعة الفيصلية",
    bio: "٢٩ عامًا في الموارد البشرية، قدت خلالها إعادة هيكلة تنظيمية لثلاث شركات وبرامج احتفاظ خفّضت دوران الموظفين من ٢٦٪ إلى ٩٪. أعمل مع المنشآت التي تفقد كوادرها أو تفتقر إلى وصف وظيفي ومسارات ترقّي واضحة.",
    previousTitle: "مدير عام الموارد البشرية",
    previousOrganization: "مجموعة الفيصلية القابضة",
    years: 29,
    rating: 4.9,
    ratingCount: 7,
    completed: 24,
    categories: ["hr", "management"],
    skills: ["الاحتفاظ بالموظفين", "الهيكلة التنظيمية", "الوصف الوظيفي", "إدارة الأداء", "مسارات التطوير الوظيفي"],
    experiences: [
      { organization: "مجموعة الفيصلية القابضة", position: "مدير عام الموارد البشرية", startYear: 2010, endYear: 2024, description: "قيادة الموارد البشرية لأكثر من ٢٢٠٠ موظف وبناء نظام إدارة الأداء." },
      { organization: "شركة رواسي للمقاولات", position: "مدير الموارد البشرية", startYear: 1998, endYear: 2010, description: "تأسيس إدارة الموارد البشرية ووضع اللوائح الداخلية وسلم الرواتب." },
    ],
    educations: [{ institution: "جامعة الإمام محمد بن سعود", degree: "بكالوريوس", field: "إدارة موارد بشرية", graduationYear: 1995 }],
    certifications: [{ name: "SHRM-SCP", issuer: "SHRM", issueYear: 2014 }],
    services: [
      { name: "تشخيص دوران الموظفين", description: "تحليل أسباب المغادرة ووضع خطة احتفاظ عملية خلال جلسة واحدة.", durationMinutes: 60, priceSar: 700 },
      { name: "بناء الوصف الوظيفي ومؤشرات الأداء", description: "هيكلة الأدوار والمسؤوليات ومؤشرات قياس لكل وظيفة.", durationMinutes: 90, priceSar: 950 },
    ],
  },
  {
    email: "amal.talent@khabeer.sa",
    name: "أمل بنت محمد الزهراني",
    phone: "0551000025",
    city: "جدة",
    headline: "مستشارة استقطاب وتطوير — مديرة المواهب السابقة في شركة أفق للاتصالات",
    bio: "٢٤ عامًا في الاستقطاب وتطوير الكوادر. بنيت برامج تأهيل للخريجين وأنظمة تقييم أداء لأكثر من ١٥٠٠ موظف، وأدرت متطلبات السعودة والنطاقات لثلاث منشآت. أساعد الشركات التي تعاني ضعف جودة التوظيف أو ارتفاع تكلفة الاستقطاب.",
    previousTitle: "مديرة المواهب والتطوير",
    previousOrganization: "شركة أفق للاتصالات",
    years: 24,
    rating: 4.8,
    ratingCount: 5,
    completed: 17,
    categories: ["hr", "education"],
    skills: ["الاستقطاب والتوظيف", "السعودة والنطاقات", "برامج التأهيل", "تقييم الأداء", "تطوير الكوادر"],
    experiences: [
      { organization: "شركة أفق للاتصالات", position: "مديرة المواهب والتطوير", startYear: 2012, endYear: 2024, description: "بناء برنامج الخريجين وأنظمة تقييم الأداء لأكثر من ١٥٠٠ موظف." },
      { organization: "بنك المدى", position: "رئيسة قسم التوظيف", startYear: 2001, endYear: 2012, description: "إدارة الاستقطاب لفروع البنك وتحقيق متطلبات السعودة." },
    ],
    educations: [{ institution: "جامعة الملك عبدالعزيز", degree: "بكالوريوس", field: "علم اجتماع", graduationYear: 1999 }],
    certifications: [{ name: "CIPD Level 7", issuer: "CIPD", issueYear: 2015 }],
    services: [
      { name: "مراجعة عملية التوظيف", description: "من الإعلان إلى العرض الوظيفي: أين تفقد المرشحين الجيدين ولماذا.", durationMinutes: 60, priceSar: 600 },
      { name: "خطة سعودة ونطاقات", description: "قراءة وضعك في نطاقات ووضع خطة عملية للوصول للنطاق المستهدف.", durationMinutes: 45, priceSar: 500 },
    ],
  },

  // ── إدارة المشاريع ─────────────────────────────────────────────
  {
    email: "faisal.pm@khabeer.sa",
    name: "فيصل بن عبدالله الغامدي",
    phone: "0551000026",
    city: "الرياض",
    headline: "مستشار استرداد المشاريع المتعثرة — مدير المشاريع السابق في شركة تعمير",
    bio: "٣١ عامًا في إدارة المشاريع الإنشائية والصناعية، منها ١١ عامًا متخصصًا في إنقاذ المشاريع المتعثرة. استلمت ثمانية مشاريع متأخرة وأعدت خمسة منها إلى المسار خلال أقل من سنة. أعمل مع أصحاب المشاريع الذين يواجهون تأخيرًا ومطالبات من المقاول.",
    previousTitle: "مدير المشاريع الكبرى",
    previousOrganization: "شركة تعمير للمقاولات",
    years: 31,
    rating: 4.9,
    ratingCount: 8,
    completed: 26,
    categories: ["project-management", "engineering"],
    skills: ["استرداد المشاريع المتعثرة", "إدارة المطالبات", "ضبط الجدول الزمني", "إدارة المقاولين", "تحليل الانحرافات"],
    experiences: [
      { organization: "شركة تعمير للمقاولات", position: "مدير المشاريع الكبرى", startYear: 2007, endYear: 2023, description: "إدارة محفظة مشاريع بقيمة تتجاوز ٢ مليار ريال وقيادة فريق استرداد المشاريع المتعثرة." },
      { organization: "مكتب هندسة البناء الاستشاري", position: "مدير مشروع", startYear: 1994, endYear: 2007, description: "الإشراف على تنفيذ مشاريع سكنية وتجارية ومتابعة المقاولين." },
    ],
    educations: [{ institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "هندسة مدنية", graduationYear: 1992 }],
    certifications: [{ name: "PMP", issuer: "PMI", issueYear: 2005 }],
    services: [
      { name: "تشخيص مشروع متأخر", description: "قراءة أسباب التأخير الحقيقية والفرق بين انحراف النطاق وانحراف الموارد.", durationMinutes: 60, priceSar: 800 },
      { name: "الردّ على مطالبات المقاول", description: "تقييم مطالبة تمديد المدة والتكاليف الإضافية وبناء موقفك التعاقدي.", durationMinutes: 90, priceSar: 1100 },
    ],
  },
  {
    email: "nawaf.pmo@khabeer.sa",
    name: "نواف بن سليمان الحربي",
    phone: "0551000027",
    city: "الخبر",
    headline: "مستشار مكاتب إدارة المشاريع — رئيس PMO السابق في شركة سدر الصناعية",
    bio: "٢٦ عامًا في تخطيط المشاريع وحوكمتها. أسست ثلاثة مكاتب لإدارة المشاريع من الصفر، ووضعت أنظمة متابعة رفعت نسبة الالتزام بالجدول الزمني من ٦١٪ إلى ٩٠٪. أساعد المنشآت التي تدير مشاريعها بالبريد والاجتماعات فقط.",
    previousTitle: "رئيس مكتب إدارة المشاريع",
    previousOrganization: "شركة سدر الصناعية",
    years: 26,
    rating: 4.7,
    ratingCount: 4,
    completed: 13,
    categories: ["project-management", "management"],
    skills: ["تأسيس مكتب إدارة المشاريع", "حوكمة المشاريع", "سجل المخاطر", "تخطيط الموارد", "تقارير الإنجاز"],
    experiences: [
      { organization: "شركة سدر الصناعية", position: "رئيس مكتب إدارة المشاريع", startYear: 2013, endYear: 2024, description: "تأسيس المكتب ووضع منهجية موحدة لأكثر من ٤٠ مشروعًا متزامنًا." },
      { organization: "شركة الأفق للتقنية", position: "مدير تخطيط ومتابعة", startYear: 1999, endYear: 2013, description: "بناء أنظمة المتابعة وتقارير الإنجاز للإدارة التنفيذية." },
    ],
    educations: [{ institution: "جامعة الملك فهد للبترول والمعادن", degree: "بكالوريوس", field: "هندسة نظم", graduationYear: 1997 }],
    certifications: [{ name: "PgMP", issuer: "PMI", issueYear: 2016 }],
    services: [
      { name: "تأسيس متابعة مشاريع عملية", description: "أبسط نظام متابعة يناسب حجمك، بلا برامج معقدة ولا بيروقراطية.", durationMinutes: 60, priceSar: 650 },
      { name: "مراجعة سجل المخاطر", description: "بناء سجل مخاطر حقيقي لمشروعك وتحديد ما يستحق خطة استجابة.", durationMinutes: 45, priceSar: 500 },
    ],
  },

  // ── المالية ────────────────────────────────────────────────────
  {
    email: "reem.cash@khabeer.sa",
    name: "ريم بنت سعود الدوسري",
    phone: "0551000028",
    city: "الرياض",
    headline: "مستشارة تدفقات نقدية — المديرة المالية السابقة لمجموعة نخبة التجارية",
    bio: "٢٣ عامًا في الإدارة المالية للشركات المتوسطة. تخصصي معالجة الفجوة بين دورة التحصيل ودورة السداد، وهي المشكلة التي تُغرق شركات مبيعاتها ممتازة. أعدت هيكلة الدورة المالية لأكثر من ٣٠ منشأة.",
    previousTitle: "المديرة المالية",
    previousOrganization: "مجموعة نخبة التجارية",
    years: 23,
    rating: 4.8,
    ratingCount: 6,
    completed: 19,
    categories: ["finance", "management"],
    skills: ["إدارة التدفق النقدي", "دورة التحصيل", "رأس المال العامل", "التسعير والتكاليف", "الموازنات التقديرية"],
    experiences: [
      { organization: "مجموعة نخبة التجارية", position: "المديرة المالية", startYear: 2012, endYear: 2024, description: "إدارة مالية لخمس شركات تابعة وإعادة هيكلة رأس المال العامل." },
      { organization: "شركة الميّاد للتوزيع", position: "مديرة حسابات", startYear: 2002, endYear: 2012, description: "بناء نظام التحصيل ومتابعة الذمم المدينة." },
    ],
    educations: [{ institution: "جامعة الأميرة نورة", degree: "بكالوريوس", field: "محاسبة", graduationYear: 2001 }],
    certifications: [{ name: "زمالة SOCPA", issuer: "الهيئة السعودية للمراجعين والمحاسبين", issueYear: 2009 }],
    services: [
      { name: "معالجة تعثر التدفق النقدي", description: "إعادة ترتيب دورة التحصيل والسداد لإغلاق الفجوة النقدية.", durationMinutes: 60, priceSar: 750 },
      { name: "مراجعة التسعير والهوامش", description: "حساب الهامش الحقيقي لكل خط منتج بعد التكاليف غير المباشرة.", durationMinutes: 60, priceSar: 700 },
    ],
  },

  // ── التسويق ────────────────────────────────────────────────────
  {
    email: "tariq.growth@khabeer.sa",
    name: "طارق بن يوسف الأنصاري",
    phone: "0551000029",
    city: "جدة",
    headline: "مستشار تسويق — مدير التسويق السابق في مجموعة سلام للتجزئة",
    bio: "٢٥ عامًا في التسويق، منها ١٠ في التسويق الرقمي. تخصصي تحويل الإنفاق الإعلاني من تفاعل بلا مبيعات إلى عملاء دافعين، عبر تعريف دقيق للعميل المثالي وقياس تكلفة اكتسابه. خفّضت تكلفة اكتساب العميل ٤١٪ في آخر برنامج قدته.",
    previousTitle: "مدير التسويق",
    previousOrganization: "مجموعة سلام للتجزئة",
    years: 25,
    rating: 4.7,
    ratingCount: 5,
    completed: 16,
    categories: ["marketing", "sales"],
    skills: ["تكلفة اكتساب العميل", "تعريف العميل المثالي", "قياس العائد التسويقي", "التسويق الرقمي", "بناء العلامة التجارية"],
    experiences: [
      { organization: "مجموعة سلام للتجزئة", position: "مدير التسويق", startYear: 2011, endYear: 2024, description: "إدارة ميزانية تسويقية سنوية تتجاوز ٢٥ مليون ريال وبناء نظام قياس العائد." },
      { organization: "وكالة بصمة للإعلان", position: "مدير حسابات أول", startYear: 1999, endYear: 2011, description: "إدارة حملات لعملاء في قطاعات التجزئة والاتصالات." },
    ],
    educations: [{ institution: "جامعة الملك عبدالعزيز", degree: "بكالوريوس", field: "تسويق", graduationYear: 1998 }],
    certifications: [{ name: "شهادة التسويق الرقمي المتقدم", issuer: "Google", issueYear: 2018 }],
    services: [
      { name: "لماذا لا يتحوّل التفاعل إلى مبيعات؟", description: "مراجعة إنفاقك الإعلاني وقنواتك وتحديد أين ينقطع المسار نحو الشراء.", durationMinutes: 60, priceSar: 650 },
      { name: "تحديد العميل المثالي", description: "بناء تعريف دقيق لعميلك المثالي ورسالة تميّزك عن المنافسين.", durationMinutes: 45, priceSar: 500 },
    ],
  },

  // ── الأمن السيبراني ────────────────────────────────────────────
  {
    email: "majed.cyber@khabeer.sa",
    name: "ماجد بن عبدالعزيز السبيعي",
    phone: "0551000030",
    city: "الرياض",
    headline: "مستشار أمن سيبراني — مدير أمن المعلومات السابق في بنك المدى",
    bio: "٢٨ عامًا في أمن المعلومات، منها ١٥ في القطاع المصرفي. قدت الاستجابة لثلاث حوادث اختراق فعلية وبنيت برامج امتثال لضوابط الهيئة الوطنية للأمن السيبراني. أعمل مع المنشآت التي تعرضت لتصيّد أو تفتقر إلى سياسات ونسخ احتياطية.",
    previousTitle: "مدير أمن المعلومات",
    previousOrganization: "بنك المدى",
    years: 28,
    rating: 4.9,
    ratingCount: 6,
    completed: 20,
    categories: ["cybersecurity", "it"],
    skills: ["تقييم المخاطر السيبرانية", "الاستجابة للحوادث", "ضوابط الهيئة الوطنية للأمن السيبراني", "التوعية الأمنية", "النسخ الاحتياطي والاسترجاع"],
    experiences: [
      { organization: "بنك المدى", position: "مدير أمن المعلومات", startYear: 2009, endYear: 2024, description: "بناء مركز عمليات الأمن وقيادة الاستجابة للحوادث والامتثال التنظيمي." },
      { organization: "شركة تقنية الخليج", position: "مهندس أمن شبكات أول", startYear: 1996, endYear: 2009, description: "تصميم بنى أمن الشبكات لعملاء في القطاعين الحكومي والمصرفي." },
    ],
    educations: [{ institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "علوم حاسب", graduationYear: 1995 }],
    certifications: [
      { name: "CISSP", issuer: "ISC2", issueYear: 2007 },
      { name: "CISM", issuer: "ISACA", issueYear: 2012 },
    ],
    services: [
      { name: "تقييم سريع للمخاطر السيبرانية", description: "بعد حادثة تصيّد أو قبلها: أين أنت معرّض فعليًا وما أول ثلاث خطوات.", durationMinutes: 60, priceSar: 800 },
      { name: "خطة امتثال للضوابط الأساسية", description: "قراءة متطلبات قطاعك وبناء خطة امتثال واقعية بحجم منشأتك.", durationMinutes: 90, priceSar: 1100 },
    ],
  },
];

async function main() {
  const categoryRows = await db.category.findMany({ select: { id: true, slug: true } });
  const categories = new Map(categoryRows.map((row) => [row.slug, row.id]));
  if (categories.size === 0) throw new Error("لا توجد تصنيفات — شغّل npm run db:seed أولًا");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let created = 0;

  for (const seed of EXPERTS) {
    const existing = await db.user.findUnique({ where: { email: seed.email }, select: { id: true } });
    if (existing) continue;

    const minPrice = Math.min(...seed.services.map((service) => service.priceSar));

    await db.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        passwordHash,
        role: "EXPERT",
        phone: seed.phone,
        city: seed.city,
        expertProfile: {
          create: {
            headline: seed.headline,
            bio: seed.bio,
            previousTitle: seed.previousTitle,
            previousOrganization: seed.previousOrganization,
            yearsOfExperience: seed.years,
            city: seed.city,
            verificationStatus: "VERIFIED",
            ratingAvg: seed.rating,
            ratingCount: seed.ratingCount,
            completedConsultations: seed.completed,
            minPriceSar: minPrice,
            onboardingStep: 5,
            publishedAt: new Date(),
            experiences: {
              create: seed.experiences.map((experience, index) => ({
                organization: experience.organization,
                position: experience.position,
                startYear: experience.startYear,
                endYear: experience.endYear ?? null,
                isCurrent: false,
                description: experience.description,
                sortOrder: index,
              })),
            },
            educations: { create: seed.educations.map((education, index) => ({ ...education, sortOrder: index })) },
            certifications: {
              create: seed.certifications.map((certification, index) => ({ ...certification, sortOrder: index })),
            },
            skills: { create: seed.skills.map((name) => ({ name })) },
            services: { create: seed.services.map((service, index) => ({ ...service, sortOrder: index })) },
            availability: { create: WEEK_AVAILABILITY },
            categories: {
              create: seed.categories
                .filter((slug) => categories.has(slug))
                .map((slug) => ({ category: { connect: { id: categories.get(slug)! } } })),
            },
          },
        },
      },
    });
    created += 1;
  }

  const total = await db.expertProfile.count({ where: { verificationStatus: "VERIFIED" } });
  console.log(`تمت إضافة ${created} خبيرًا — إجمالي الخبراء الموثّقين الآن ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
