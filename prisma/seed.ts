import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Khabeer@123";

const CATEGORIES = [
  { name: "الإدارة", slug: "management", icon: "Briefcase" },
  { name: "الهندسة", slug: "engineering", icon: "HardHat" },
  { name: "المالية والمحاسبة", slug: "finance", icon: "Landmark" },
  { name: "الموارد البشرية", slug: "hr", icon: "Users" },
  { name: "القانون", slug: "legal", icon: "Scale" },
  { name: "تقنية المعلومات", slug: "it", icon: "Cpu" },
  { name: "الأمن السيبراني", slug: "cybersecurity", icon: "ShieldCheck" },
  { name: "إدارة المشاريع", slug: "project-management", icon: "ClipboardList" },
  { name: "التسويق", slug: "marketing", icon: "Megaphone" },
  { name: "المبيعات", slug: "sales", icon: "TrendingUp" },
  { name: "التعليم والتدريب", slug: "education", icon: "GraduationCap" },
  { name: "الجودة", slug: "quality", icon: "BadgeCheck" },
  { name: "سلاسل الإمداد", slug: "supply-chain", icon: "Truck" },
  { name: "الصحة", slug: "healthcare", icon: "HeartPulse" },
  { name: "الطاقة", slug: "energy", icon: "Zap" },
  { name: "الصناعة", slug: "industry", icon: "Factory" },
  { name: "الاستشارات الإدارية", slug: "consulting", icon: "Lightbulb" },
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
  categories: string[];
  skills: string[];
  experiences: {
    organization: string;
    position: string;
    startYear: number;
    endYear?: number;
    description: string;
  }[];
  educations: { institution: string; degree: string; field: string; graduationYear: number }[];
  certifications: { name: string; issuer: string; issueYear: number }[];
  services: { name: string; description: string; durationMinutes: number; priceSar: number }[];
  availability: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  verificationStatus: "VERIFIED" | "PENDING";
};

const WORK_HOURS = [
  { dayOfWeek: 0, startMinute: 10 * 60, endMinute: 14 * 60 },
  { dayOfWeek: 1, startMinute: 10 * 60, endMinute: 14 * 60 },
  { dayOfWeek: 2, startMinute: 16 * 60, endMinute: 20 * 60 },
  { dayOfWeek: 3, startMinute: 10 * 60, endMinute: 13 * 60 },
];

const EVENING_HOURS = [
  { dayOfWeek: 0, startMinute: 17 * 60, endMinute: 21 * 60 },
  { dayOfWeek: 2, startMinute: 17 * 60, endMinute: 21 * 60 },
  { dayOfWeek: 4, startMinute: 16 * 60, endMinute: 20 * 60 },
];

const MORNING_HOURS = [
  { dayOfWeek: 1, startMinute: 9 * 60, endMinute: 13 * 60 },
  { dayOfWeek: 3, startMinute: 9 * 60, endMinute: 13 * 60 },
  { dayOfWeek: 6, startMinute: 11 * 60, endMinute: 15 * 60 },
];

const EXPERTS: ExpertSeed[] = [
  {
    email: "abdullah@khabeer.sa",
    name: "عبدالله بن فهد الدوسري",
    phone: "0551000001",
    city: "الرياض",
    headline: "مستشار مالي — الرئيس المالي السابق لمجموعة مدار الصناعية",
    bio: "أمضيت أكثر من ثلاثين عامًا في الإدارة المالية داخل قطاع الصناعة، تدرّجت خلالها من محاسب إلى رئيس مالي لمجموعة تضم سبع شركات تابعة. قدت عمليات إعادة هيكلة مالية وبرامج خفض تكاليف وفرت أكثر من ١٨٪ من المصروفات التشغيلية، وأشرفت على إعداد الشركة للاكتتاب. أقدّم اليوم استشارات في بناء الهياكل المالية، وضبط التدفقات النقدية، وتأهيل الشركات العائلية للحوكمة المالية.",
    previousTitle: "الرئيس المالي",
    previousOrganization: "مجموعة مدار الصناعية",
    years: 32,
    categories: ["finance", "management"],
    skills: ["التخطيط المالي", "إعادة الهيكلة", "الحوكمة المالية", "إدارة التدفقات النقدية", "الميزانيات"],
    experiences: [
      {
        organization: "مجموعة مدار الصناعية",
        position: "الرئيس المالي",
        startYear: 2008,
        endYear: 2023,
        description: "قيادة القطاع المالي لسبع شركات تابعة، وإعداد المجموعة لمتطلبات الحوكمة والإفصاح.",
      },
      {
        organization: "شركة الرافد للتجارة",
        position: "مدير مالي",
        startYear: 1999,
        endYear: 2008,
        description: "بناء الإدارة المالية من الصفر وتأسيس دورة الميزانيات والتقارير الشهرية.",
      },
      {
        organization: "مكتب الأمانة للمحاسبة",
        position: "محاسب أول",
        startYear: 1992,
        endYear: 1999,
        description: "مراجعة حسابات لعملاء في قطاعي المقاولات والتجزئة.",
      },
    ],
    educations: [
      {
        institution: "جامعة الملك سعود",
        degree: "بكالوريوس",
        field: "محاسبة",
        graduationYear: 1991,
      },
      {
        institution: "جامعة الملك فهد للبترول والمعادن",
        degree: "ماجستير",
        field: "إدارة أعمال تنفيذية",
        graduationYear: 2005,
      },
    ],
    certifications: [
      { name: "زمالة المحاسبين القانونيين SOCPA", issuer: "الهيئة السعودية للمراجعين والمحاسبين", issueYear: 2001 },
      { name: "CMA — محاسب إداري معتمد", issuer: "IMA", issueYear: 2009 },
    ],
    services: [
      {
        name: "جلسة استشارية في إعادة هيكلة الإدارة المالية",
        description: "مراجعة الهيكل المالي الحالي وتحديد فرص التحسين وخطة تنفيذ عملية خلال ٩٠ يومًا.",
        durationMinutes: 60,
        priceSar: 1200,
      },
      {
        name: "مراجعة خطة مالية أو نموذج تشغيلي",
        description: "قراءة نقدية لخطتك المالية أو نموذجك التشغيلي مع ملاحظات مكتوبة بعد الجلسة.",
        durationMinutes: 45,
        priceSar: 750,
      },
    ],
    availability: WORK_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "munira@khabeer.sa",
    name: "منيرة بنت سعود القحطاني",
    phone: "0551000002",
    city: "الرياض",
    headline: "مستشارة موارد بشرية — مديرة عامة سابقة للموارد البشرية",
    bio: "قضيت سبعة وعشرين عامًا في الموارد البشرية، آخرها كمديرة عامة للموارد البشرية في شركة اتصالات تضم أكثر من ألفي موظف. عملت على بناء أنظمة الأداء والمسارات الوظيفية وبرامج التوطين، وأدرت مشاريع تحول ثقافي بعد اندماج شركتين. أساعد الجهات اليوم في بناء سياسات موارد بشرية عملية بعيدًا عن التعقيد.",
    previousTitle: "مدير عام الموارد البشرية",
    previousOrganization: "شركة أفق للاتصالات",
    years: 27,
    categories: ["hr", "management"],
    skills: ["إدارة الأداء", "التخطيط الوظيفي", "التوطين", "سياسات الموارد البشرية", "التحول المؤسسي"],
    experiences: [
      {
        organization: "شركة أفق للاتصالات",
        position: "مدير عام الموارد البشرية",
        startYear: 2012,
        endYear: 2024,
        description: "قيادة قطاع الموارد البشرية لأكثر من ٢٠٠٠ موظف وبناء نظام إدارة الأداء.",
      },
      {
        organization: "مجموعة الواحة القابضة",
        position: "مدير التوظيف والتطوير",
        startYear: 2003,
        endYear: 2012,
        description: "تأسيس وحدة التطوير الوظيفي وبرامج التدريب الداخلية.",
      },
    ],
    educations: [
      { institution: "جامعة الأميرة نورة", degree: "بكالوريوس", field: "إدارة أعمال", graduationYear: 1996 },
    ],
    certifications: [
      { name: "SHRM-SCP", issuer: "SHRM", issueYear: 2015 },
      { name: "مدقق نظم إدارة الجودة", issuer: "المنظمة السعودية للمواصفات", issueYear: 2011 },
    ],
    services: [
      {
        name: "بناء نظام إدارة أداء عملي",
        description: "تصميم إطار تقييم أداء مناسب لحجم منشأتك مع نماذج جاهزة للتطبيق.",
        durationMinutes: 60,
        priceSar: 900,
      },
      {
        name: "مراجعة سياسات ولوائح الموارد البشرية",
        description: "قراءة لائحتك الداخلية ومطابقتها مع نظام العمل مع توصيات مكتوبة.",
        durationMinutes: 45,
        priceSar: 600,
      },
    ],
    availability: EVENING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "saad@khabeer.sa",
    name: "سعد بن ناصر العتيبي",
    phone: "0551000003",
    city: "جدة",
    headline: "مستشار مشاريع إنشائية — مدير مشاريع سابق بشركة البنيان للمقاولات",
    bio: "خمسة وثلاثون عامًا في تنفيذ وإدارة المشاريع الإنشائية الكبرى، من الأبراج التجارية إلى المنشآت الصناعية. أدرت محافظ مشاريع تجاوزت قيمتها ملياري ريال، وتخصصت في إنقاذ المشاريع المتعثرة وإعادة جدولتها. أقدّم استشارات في التخطيط الزمني، وإدارة المطالبات، وضبط تكاليف التنفيذ.",
    previousTitle: "مدير عام المشاريع",
    previousOrganization: "شركة البنيان للمقاولات",
    years: 35,
    categories: ["project-management", "engineering"],
    skills: ["الجدولة الزمنية", "إدارة المطالبات", "ضبط التكاليف", "إدارة المقاولين", "المشاريع المتعثرة"],
    experiences: [
      {
        organization: "شركة البنيان للمقاولات",
        position: "مدير عام المشاريع",
        startYear: 2006,
        endYear: 2022,
        description: "إدارة محفظة مشاريع بقيمة تتجاوز ملياري ريال في ثلاث مناطق.",
      },
      {
        organization: "شركة تعمير الخليج",
        position: "مدير مشروع",
        startYear: 1995,
        endYear: 2006,
        description: "تنفيذ مشاريع أبراج تجارية ومنشآت صناعية.",
      },
    ],
    educations: [
      { institution: "جامعة الملك عبدالعزيز", degree: "بكالوريوس", field: "هندسة مدنية", graduationYear: 1989 },
    ],
    certifications: [
      { name: "PMP — محترف إدارة مشاريع", issuer: "PMI", issueYear: 2004 },
      { name: "شهادة التخطيط بالبريمافيرا", issuer: "Oracle", issueYear: 2010 },
    ],
    services: [
      {
        name: "تقييم مشروع متعثر وخطة إنقاذ",
        description: "تشخيص أسباب التعثر ووضع خطة استرداد زمنية ومالية قابلة للتنفيذ.",
        durationMinutes: 90,
        priceSar: 1500,
      },
      {
        name: "مراجعة برنامج زمني وعقد مقاولة",
        description: "فحص البرنامج الزمني وبنود العقد وتحديد المخاطر قبل التوقيع.",
        durationMinutes: 60,
        priceSar: 950,
      },
    ],
    availability: WORK_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "hind@khabeer.sa",
    name: "هند بنت خالد الشمري",
    phone: "0551000004",
    city: "الدمام",
    headline: "مستشارة تعليمية وتدريبية — مشرفة تربوية سابقة",
    bio: "أربعة وعشرون عامًا في الميدان التعليمي بين التدريس والإشراف التربوي وتطوير المناهج المساندة. أشرفت على برامج تدريب لأكثر من ٦٠٠ معلم ومعلمة، وصممت برامج تحسين مهارات القراءة في مدارس المرحلة الابتدائية. أقدّم استشارات في تصميم البرامج التدريبية وتقييم جودة العملية التعليمية.",
    previousTitle: "مشرفة تربوية",
    previousOrganization: "إدارة التعليم بالمنطقة الشرقية",
    years: 24,
    categories: ["education", "quality"],
    skills: ["تصميم البرامج التدريبية", "تطوير المناهج", "قياس أثر التدريب", "الإشراف التربوي"],
    experiences: [
      {
        organization: "إدارة التعليم بالمنطقة الشرقية",
        position: "مشرفة تربوية",
        startYear: 2010,
        endYear: 2024,
        description: "الإشراف على أداء المعلمين وبرامج التطوير المهني في ٢٢ مدرسة.",
      },
      {
        organization: "مدارس الرواد الأهلية",
        position: "وكيلة الشؤون التعليمية",
        startYear: 2000,
        endYear: 2010,
        description: "قيادة الخطط التعليمية وبرامج تحسين نتائج الطلاب.",
      },
    ],
    educations: [
      { institution: "جامعة الإمام عبدالرحمن بن فيصل", degree: "بكالوريوس", field: "مناهج وطرق تدريس", graduationYear: 1999 },
      { institution: "جامعة الملك سعود", degree: "ماجستير", field: "إدارة تربوية", graduationYear: 2012 },
    ],
    certifications: [
      { name: "مدربة معتمدة TOT", issuer: "المؤسسة العامة للتدريب التقني والمهني", issueYear: 2013 },
    ],
    services: [
      {
        name: "تصميم برنامج تدريبي متكامل",
        description: "تحديد الاحتياج التدريبي وبناء محتوى البرنامج وأدوات قياس الأثر.",
        durationMinutes: 60,
        priceSar: 700,
      },
      {
        name: "استشارة في تطوير الأداء المدرسي",
        description: "مراجعة الخطط التشغيلية للمدرسة وتحديد أولويات التحسين.",
        durationMinutes: 45,
        priceSar: 450,
      },
    ],
    availability: MORNING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "fahad@khabeer.sa",
    name: "فهد بن عبدالرحمن المطيري",
    phone: "0551000005",
    city: "الرياض",
    headline: "مستشار أمن معلومات — مدير أمن المعلومات السابق في بنك الواحة",
    bio: "اثنان وعشرون عامًا في أمن المعلومات وحوكمة التقنية داخل القطاع المصرفي. بنيت مركز عمليات أمنية متكاملًا، وقدت الامتثال لمتطلبات إطار البنك المركزي للأمن السيبراني. أقدّم استشارات في تقييم الجاهزية الأمنية، وبناء سياسات الأمن، والاستعداد للتدقيق.",
    previousTitle: "مدير أمن المعلومات",
    previousOrganization: "بنك الواحة",
    years: 22,
    categories: ["cybersecurity", "it"],
    skills: ["حوكمة الأمن السيبراني", "إدارة المخاطر", "الامتثال", "مراكز العمليات الأمنية", "استجابة الحوادث"],
    experiences: [
      {
        organization: "بنك الواحة",
        position: "مدير أمن المعلومات",
        startYear: 2013,
        endYear: 2024,
        description: "بناء مركز العمليات الأمنية وقيادة برنامج الامتثال لإطار البنك المركزي.",
      },
      {
        organization: "شركة أنظمة الخليج",
        position: "مهندس أمن أول",
        startYear: 2003,
        endYear: 2013,
        description: "تصميم حلول أمن الشبكات لعملاء في القطاعين المصرفي والحكومي.",
      },
    ],
    educations: [
      { institution: "جامعة الملك فهد للبترول والمعادن", degree: "بكالوريوس", field: "علوم حاسب", graduationYear: 2002 },
    ],
    certifications: [
      { name: "CISSP", issuer: "ISC2", issueYear: 2011 },
      { name: "CISM", issuer: "ISACA", issueYear: 2014 },
    ],
    services: [
      {
        name: "تقييم الجاهزية للأمن السيبراني",
        description: "مراجعة وضعك الأمني الحالي مقابل الأطر التنظيمية وتحديد الفجوات ذات الأولوية.",
        durationMinutes: 60,
        priceSar: 1100,
      },
      {
        name: "استشارة بناء سياسات الأمن",
        description: "تحديد السياسات الأساسية التي تحتاجها منشأتك وترتيب تنفيذها.",
        durationMinutes: 45,
        priceSar: 700,
      },
    ],
    availability: EVENING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "talal@khabeer.sa",
    name: "طلال بن محمد الحربي",
    phone: "0551000006",
    city: "جدة",
    headline: "مستشار سلاسل إمداد — مدير سلاسل الإمداد السابق في شركة نماء للأغذية",
    bio: "تسعة وعشرون عامًا في اللوجستيات وسلاسل الإمداد داخل قطاع الأغذية والتجزئة. أعدت تصميم شبكة التوزيع لشركة تخدم أكثر من ١٢٠٠ منفذ بيع، وخفضت زمن دورة التوريد بنسبة ٣٠٪. أقدّم استشارات في تخطيط المخزون، وتصميم شبكات التوزيع، واختيار مزودي الخدمات اللوجستية.",
    previousTitle: "مدير سلاسل الإمداد",
    previousOrganization: "شركة نماء للأغذية",
    years: 29,
    categories: ["supply-chain", "industry"],
    skills: ["تخطيط المخزون", "شبكات التوزيع", "المشتريات", "إدارة المستودعات", "خفض التكاليف"],
    experiences: [
      {
        organization: "شركة نماء للأغذية",
        position: "مدير سلاسل الإمداد",
        startYear: 2009,
        endYear: 2023,
        description: "إعادة تصميم شبكة التوزيع وخفض زمن دورة التوريد ٣٠٪.",
      },
      {
        organization: "مجموعة السواعد التجارية",
        position: "مدير مستودعات ولوجستيات",
        startYear: 1997,
        endYear: 2009,
        description: "إدارة مستودعات مركزية وأساطيل توزيع في ثلاث مناطق.",
      },
    ],
    educations: [
      { institution: "جامعة الملك عبدالعزيز", degree: "بكالوريوس", field: "إدارة صناعية", graduationYear: 1995 },
    ],
    certifications: [{ name: "CSCP", issuer: "ASCM", issueYear: 2012 }],
    services: [
      {
        name: "مراجعة سلسلة الإمداد وتحديد الهدر",
        description: "تحليل دورة التوريد لديك وتحديد نقاط الهدر وفرص خفض التكلفة.",
        durationMinutes: 60,
        priceSar: 850,
      },
      {
        name: "استشارة تخطيط المخزون",
        description: "بناء سياسة مخزون تناسب حجم أعمالك وتقلل نفاد الأصناف.",
        durationMinutes: 45,
        priceSar: 550,
      },
    ],
    availability: WORK_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "noura@khabeer.sa",
    name: "نورة بنت إبراهيم السبيعي",
    phone: "0551000007",
    city: "الرياض",
    headline: "مستشارة قانونية — المستشارة القانونية السابقة لشركة الرواد القابضة",
    bio: "ستة وعشرون عامًا في الاستشارات القانونية للشركات، مع تركيز على العقود التجارية وحوكمة الشركات وتسوية النزاعات. أدرت الملف القانوني لعمليات استحواذ وشراكات تجاوزت قيمتها ٤٠٠ مليون ريال. أقدّم استشارات في صياغة ومراجعة العقود وإدارة المخاطر القانونية.",
    previousTitle: "المستشارة القانونية",
    previousOrganization: "شركة الرواد القابضة",
    years: 26,
    categories: ["legal", "management"],
    skills: ["العقود التجارية", "حوكمة الشركات", "تسوية النزاعات", "الاستحواذ والاندماج", "الامتثال"],
    experiences: [
      {
        organization: "شركة الرواد القابضة",
        position: "المستشارة القانونية",
        startYear: 2011,
        endYear: 2024,
        description: "قيادة الملف القانوني لصفقات استحواذ وشراكات كبرى.",
      },
      {
        organization: "مكتب الميزان للمحاماة",
        position: "محامية أولى",
        startYear: 1998,
        endYear: 2011,
        description: "الترافع والاستشارات لعملاء من قطاعات التجزئة والمقاولات.",
      },
    ],
    educations: [
      { institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "أنظمة", graduationYear: 1997 },
      { institution: "جامعة الإمام محمد بن سعود", degree: "ماجستير", field: "قانون تجاري", graduationYear: 2008 },
    ],
    certifications: [{ name: "رخصة محاماة", issuer: "وزارة العدل", issueYear: 2001 }],
    services: [
      {
        name: "مراجعة عقد تجاري قبل التوقيع",
        description: "قراءة العقد وتحديد البنود الخطرة والتعديلات المقترحة.",
        durationMinutes: 45,
        priceSar: 800,
      },
      {
        name: "استشارة حوكمة وهيكلة شركة",
        description: "مناقشة الهيكل النظامي المناسب ولوائح الحوكمة الداخلية.",
        durationMinutes: 60,
        priceSar: 1100,
      },
    ],
    availability: EVENING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "majed@khabeer.sa",
    name: "ماجد بن سليمان الغامدي",
    phone: "0551000008",
    city: "الجبيل",
    headline: "مستشار عمليات صناعية — مهندس عمليات أول سابق في قطاع البتروكيماويات",
    bio: "ثلاثة وثلاثون عامًا في تشغيل وتحسين المصانع البتروكيماوية، قدت خلالها فرق عمليات وبرامج موثوقية خفضت التوقفات غير المخططة بنسبة ٤٠٪. خبرة عميقة في السلامة التشغيلية وإدارة التوقفات المجدولة. أقدّم استشارات في تحسين كفاءة المصانع وبرامج الموثوقية.",
    previousTitle: "مهندس عمليات أول",
    previousOrganization: "شركة الخليج للبتروكيماويات",
    years: 33,
    categories: ["energy", "industry"],
    skills: ["تحسين العمليات", "الموثوقية الصناعية", "السلامة التشغيلية", "إدارة التوقفات", "كفاءة الطاقة"],
    experiences: [
      {
        organization: "شركة الخليج للبتروكيماويات",
        position: "مهندس عمليات أول",
        startYear: 2004,
        endYear: 2023,
        description: "قيادة برامج الموثوقية وخفض التوقفات غير المخططة ٤٠٪.",
      },
      {
        organization: "مصانع الساحل للكيماويات",
        position: "مهندس عمليات",
        startYear: 1991,
        endYear: 2004,
        description: "تشغيل وحدات الإنتاج والإشراف على التوقفات المجدولة.",
      },
    ],
    educations: [
      { institution: "جامعة الملك فهد للبترول والمعادن", degree: "بكالوريوس", field: "هندسة كيميائية", graduationYear: 1990 },
    ],
    certifications: [
      { name: "شهادة السلامة التشغيلية المتقدمة", issuer: "NEBOSH", issueYear: 2008 },
    ],
    services: [
      {
        name: "تقييم كفاءة خط إنتاج",
        description: "مراجعة مؤشرات التشغيل وتحديد فرص رفع الكفاءة وخفض الفاقد.",
        durationMinutes: 90,
        priceSar: 1300,
      },
      {
        name: "استشارة برنامج موثوقية وصيانة",
        description: "بناء خطة صيانة وقائية تقلل التوقفات غير المخططة.",
        durationMinutes: 60,
        priceSar: 900,
      },
    ],
    availability: MORNING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "khaled@khabeer.sa",
    name: "د. خالد بن يوسف الأنصاري",
    phone: "0551000009",
    city: "المدينة المنورة",
    headline: "مستشار إدارة صحية — مدير سابق لمستشفى النخيل التخصصي",
    bio: "ثلاثون عامًا بين الممارسة الطبية وإدارة المنشآت الصحية. أدرت مستشفى بسعة ٣٠٠ سرير، وقدت مشروع الاعتماد الوطني للجودة الصحية، وطوّرت مسارات المرضى لتقليل زمن الانتظار في الطوارئ إلى النصف. أقدّم استشارات في تشغيل المنشآت الصحية وجودة الخدمة.",
    previousTitle: "مدير المستشفى",
    previousOrganization: "مستشفى النخيل التخصصي",
    years: 30,
    categories: ["healthcare", "quality"],
    skills: ["إدارة المنشآت الصحية", "الاعتماد الصحي", "مسارات المرضى", "جودة الرعاية", "التشغيل"],
    experiences: [
      {
        organization: "مستشفى النخيل التخصصي",
        position: "مدير المستشفى",
        startYear: 2012,
        endYear: 2023,
        description: "إدارة مستشفى بسعة ٣٠٠ سرير وقيادة مشروع الاعتماد الوطني.",
      },
      {
        organization: "مجمع الشفاء الطبي",
        position: "مدير الشؤون الطبية",
        startYear: 2001,
        endYear: 2012,
        description: "الإشراف على الأقسام الطبية وبرامج تحسين الجودة.",
      },
    ],
    educations: [
      { institution: "جامعة طيبة", degree: "بكالوريوس", field: "طب وجراحة", graduationYear: 1993 },
      { institution: "جامعة الملك سعود", degree: "ماجستير", field: "إدارة صحية", graduationYear: 2006 },
    ],
    certifications: [
      { name: "ممارس معتمد في جودة الرعاية الصحية", issuer: "المركز السعودي لاعتماد المنشآت الصحية", issueYear: 2014 },
    ],
    services: [
      {
        name: "استشارة تشغيل منشأة صحية",
        description: "مراجعة نموذج التشغيل ومؤشرات الأداء وخطة التحسين.",
        durationMinutes: 60,
        priceSar: 1000,
      },
      {
        name: "الاستعداد للاعتماد الصحي",
        description: "تحديد فجوات الاعتماد وخارطة طريق للجاهزية.",
        durationMinutes: 90,
        priceSar: 1400,
      },
    ],
    availability: WORK_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "reem@khabeer.sa",
    name: "ريم بنت عبدالعزيز البراك",
    phone: "0551000010",
    city: "الرياض",
    headline: "مستشارة تسويق — مديرة تسويق سابقة في مجموعة أصايل التجارية",
    bio: "واحد وعشرون عامًا في التسويق والعلامات التجارية داخل قطاع التجزئة. أطلقت أكثر من ١٥ علامة فرعية، وقدت إعادة بناء الهوية لمجموعة تجارية رفعت حصتها السوقية ٩٪ خلال عامين. أقدّم استشارات في بناء العلامة التجارية وخطط الإطلاق والتسويق الرقمي.",
    previousTitle: "مديرة التسويق",
    previousOrganization: "مجموعة أصايل التجارية",
    years: 21,
    categories: ["marketing", "sales"],
    skills: ["بناء العلامة التجارية", "خطط الإطلاق", "التسويق الرقمي", "أبحاث السوق", "إدارة الحملات"],
    experiences: [
      {
        organization: "مجموعة أصايل التجارية",
        position: "مديرة التسويق",
        startYear: 2013,
        endYear: 2024,
        description: "قيادة إعادة بناء الهوية وإطلاق علامات فرعية جديدة.",
      },
      {
        organization: "وكالة صدى للإعلان",
        position: "مديرة حسابات أولى",
        startYear: 2003,
        endYear: 2013,
        description: "إدارة حملات لعملاء في قطاعي التجزئة والأغذية.",
      },
    ],
    educations: [
      { institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "تسويق", graduationYear: 2002 },
    ],
    certifications: [{ name: "شهادة التسويق الرقمي المتقدم", issuer: "Google", issueYear: 2018 }],
    services: [
      {
        name: "بناء خطة تسويقية لعلامة جديدة",
        description: "تحديد الجمهور والرسالة والقنوات وخطة الإطلاق لأول ٩٠ يومًا.",
        durationMinutes: 60,
        priceSar: 700,
      },
      {
        name: "مراجعة هوية وحملة تسويقية",
        description: "تقييم الهوية الحالية وأداء الحملة مع توصيات تحسين.",
        durationMinutes: 45,
        priceSar: 450,
      },
    ],
    availability: EVENING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "omar@khabeer.sa",
    name: "عمر بن صالح الزهراني",
    phone: "0551000011",
    city: "الدمام",
    headline: "مستشار جودة — مدير الجودة السابق في مصانع الفيصلية",
    bio: "ثمانية وعشرون عامًا في أنظمة الجودة والتحسين المستمر في القطاع الصناعي. قدت مشاريع تطبيق الأيزو ٩٠٠١ وبرامج لين وستة سيجما التي خفضت نسبة العيوب من ٤٪ إلى أقل من ١٪. أقدّم استشارات في تأسيس أنظمة الجودة والاستعداد لشهادات الاعتماد.",
    previousTitle: "مدير الجودة",
    previousOrganization: "مصانع الفيصلية",
    years: 28,
    categories: ["quality", "industry"],
    skills: ["أيزو ٩٠٠١", "لين وستة سيجما", "التحسين المستمر", "تدقيق الجودة", "ضبط العمليات"],
    experiences: [
      {
        organization: "مصانع الفيصلية",
        position: "مدير الجودة",
        startYear: 2008,
        endYear: 2023,
        description: "تطبيق أنظمة الجودة وخفض نسبة العيوب إلى أقل من ١٪.",
      },
      {
        organization: "شركة المعادن الوطنية",
        position: "مهندس جودة أول",
        startYear: 1996,
        endYear: 2008,
        description: "بناء نظام ضبط الجودة وتدريب فرق الإنتاج.",
      },
    ],
    educations: [
      { institution: "جامعة الملك فيصل", degree: "بكالوريوس", field: "هندسة صناعية", graduationYear: 1995 },
    ],
    certifications: [
      { name: "الحزام الأسود — ستة سيجما", issuer: "ASQ", issueYear: 2010 },
      { name: "مدقق رئيسي أيزو ٩٠٠١", issuer: "IRCA", issueYear: 2007 },
    ],
    services: [
      {
        name: "تأسيس نظام جودة والاستعداد للأيزو",
        description: "خارطة طريق لتطبيق نظام الجودة والحصول على الشهادة.",
        durationMinutes: 60,
        priceSar: 800,
      },
      {
        name: "مراجعة عمليات وتقليل الفاقد",
        description: "تحليل عملية إنتاجية وتحديد أسباب الفاقد وخطة معالجتها.",
        durationMinutes: 45,
        priceSar: 550,
      },
    ],
    availability: MORNING_HOURS,
    verificationStatus: "VERIFIED",
  },
  {
    email: "badr@khabeer.sa",
    name: "بدر بن عوض المالكي",
    phone: "0551000012",
    city: "الرياض",
    headline: "مستشار إداري — شريك سابق في شركة تمكين للاستشارات",
    bio: "خمسة وعشرون عامًا في الاستشارات الإدارية وبناء الاستراتيجيات لمنشآت متوسطة وكبيرة. عملت مع أكثر من ٤٠ منشأة على إعادة تصميم الهياكل التنظيمية وبناء مؤشرات الأداء. أقدّم استشارات في التخطيط الاستراتيجي والهيكلة التنظيمية.",
    previousTitle: "شريك استشاري",
    previousOrganization: "شركة تمكين للاستشارات",
    years: 25,
    categories: ["consulting", "management"],
    skills: ["التخطيط الاستراتيجي", "الهياكل التنظيمية", "مؤشرات الأداء", "إدارة التغيير"],
    experiences: [
      {
        organization: "شركة تمكين للاستشارات",
        position: "شريك استشاري",
        startYear: 2010,
        endYear: 2024,
        description: "قيادة مشاريع استراتيجية وهيكلة تنظيمية لأكثر من ٤٠ منشأة.",
      },
    ],
    educations: [
      { institution: "جامعة الملك سعود", degree: "بكالوريوس", field: "إدارة عامة", graduationYear: 1998 },
    ],
    certifications: [{ name: "معتمد في بطاقة الأداء المتوازن", issuer: "BSI", issueYear: 2013 }],
    services: [
      {
        name: "ورشة تخطيط استراتيجي مصغّرة",
        description: "جلسة عمل لتحديد التوجه الاستراتيجي والأولويات للسنة القادمة.",
        durationMinutes: 90,
        priceSar: 1200,
      },
    ],
    availability: WORK_HOURS,
    verificationStatus: "PENDING",
  },
  {
    email: "salman@khabeer.sa",
    name: "سلمان بن عايض الشهري",
    phone: "0551000013",
    city: "أبها",
    headline: "مستشار تقنية معلومات — مدير تقنية سابق في شركة أفق الرقمية",
    bio: "عشرون عامًا في إدارة البنية التقنية وأنظمة المؤسسات، مع خبرة في مشاريع التحول الرقمي وترحيل الأنظمة إلى السحابة. أقدّم استشارات في اختيار الأنظمة وبناء خارطة التحول الرقمي.",
    previousTitle: "مدير تقنية المعلومات",
    previousOrganization: "شركة أفق الرقمية",
    years: 20,
    categories: ["it", "project-management"],
    skills: ["التحول الرقمي", "أنظمة ERP", "الحوسبة السحابية", "إدارة البنية التقنية"],
    experiences: [
      {
        organization: "شركة أفق الرقمية",
        position: "مدير تقنية المعلومات",
        startYear: 2012,
        endYear: 2024,
        description: "قيادة مشاريع التحول الرقمي وترحيل الأنظمة للسحابة.",
      },
    ],
    educations: [
      { institution: "جامعة الملك خالد", degree: "بكالوريوس", field: "نظم معلومات", graduationYear: 2003 },
    ],
    certifications: [{ name: "ITIL v4", issuer: "AXELOS", issueYear: 2019 }],
    services: [
      {
        name: "استشارة اختيار نظام ERP",
        description: "تحديد احتياجك الفعلي ومقارنة الخيارات المتاحة قبل الشراء.",
        durationMinutes: 60,
        priceSar: 650,
      },
    ],
    availability: EVENING_HOURS,
    verificationStatus: "PENDING",
  },
];

const CLIENTS = [
  {
    email: "ahmed@mada-solutions.sa",
    name: "أحمد بن راشد الرشيد",
    phone: "0561000001",
    city: "الرياض",
    isCompany: true,
    companyName: "شركة مدى للحلول الصناعية",
    industry: "الصناعة",
  },
  {
    email: "sultan@binaa.sa",
    name: "سلطان بن مطلق العنزي",
    phone: "0561000002",
    city: "جدة",
    isCompany: true,
    companyName: "مؤسسة بناء المستقبل للمقاولات",
    industry: "المقاولات",
  },
  {
    email: "lama@nabd-health.sa",
    name: "لمى بنت فيصل الحمدان",
    phone: "0561000003",
    city: "الدمام",
    isCompany: true,
    companyName: "شركة نبض الصحية",
    industry: "الرعاية الصحية",
  },
  {
    email: "faisal@khabeer.sa",
    name: "فيصل بن تركي الدخيل",
    phone: "0561000004",
    city: "الرياض",
    isCompany: false,
    companyName: null,
    industry: null,
  },
  {
    email: "jawaher@khabeer.sa",
    name: "جواهر بنت ماجد العمري",
    phone: "0561000005",
    city: "الخبر",
    isCompany: false,
    companyName: null,
    industry: null,
  },
];

function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function bookingRef() {
  return `KHB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function main() {
  console.log("🌱 تهيئة البيانات التجريبية…");

  await db.notification.deleteMany();
  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.review.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.favorite.deleteMany();
  await db.consultingService.deleteMany();
  await db.availabilitySlot.deleteMany();
  await db.skill.deleteMany();
  await db.certification.deleteMany();
  await db.education.deleteMany();
  await db.experience.deleteMany();
  await db.expertCategory.deleteMany();
  await db.category.deleteMany();
  await db.expertProfile.deleteMany();
  await db.clientProfile.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const categories = new Map<string, string>();
  for (const [index, category] of CATEGORIES.entries()) {
    const created = await db.category.create({
      data: { ...category, sortOrder: index },
    });
    categories.set(category.slug, created.id);
  }

  await db.user.create({
    data: {
      name: "مشرف منصة خبير",
      email: "admin@khabeer.sa",
      passwordHash,
      role: "ADMIN",
      city: "الرياض",
      phone: "0500000000",
    },
  });

  const expertUsers: { userId: string; profileId: string; seed: ExpertSeed }[] = [];

  for (const seed of EXPERTS) {
    const minPrice = Math.min(...seed.services.map((service) => service.priceSar));

    const user = await db.user.create({
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
            verificationStatus: seed.verificationStatus,
            minPriceSar: minPrice,
            onboardingStep: 5,
            publishedAt: new Date(),
            experiences: {
              create: seed.experiences.map((experience, index) => ({
                organization: experience.organization,
                position: experience.position,
                startYear: experience.startYear,
                endYear: experience.endYear ?? null,
                isCurrent: experience.endYear === undefined,
                description: experience.description,
                sortOrder: index,
              })),
            },
            educations: {
              create: seed.educations.map((education, index) => ({
                ...education,
                sortOrder: index,
              })),
            },
            certifications: {
              create: seed.certifications.map((certification, index) => ({
                ...certification,
                sortOrder: index,
              })),
            },
            skills: { create: seed.skills.map((name) => ({ name })) },
            services: {
              create: seed.services.map((service, index) => ({
                ...service,
                sortOrder: index,
              })),
            },
            availability: { create: seed.availability },
            categories: {
              create: seed.categories.map((slug) => ({
                category: { connect: { id: categories.get(slug)! } },
              })),
            },
          },
        },
      },
      include: { expertProfile: true },
    });

    expertUsers.push({ userId: user.id, profileId: user.expertProfile!.id, seed });
  }

  const clientUsers: { userId: string; name: string }[] = [];
  for (const client of CLIENTS) {
    const user = await db.user.create({
      data: {
        name: client.name,
        email: client.email,
        passwordHash,
        role: "CLIENT",
        phone: client.phone,
        city: client.city,
        clientProfile: {
          create: {
            isCompany: client.isCompany,
            companyName: client.companyName,
            industry: client.industry,
          },
        },
      },
    });
    clientUsers.push({ userId: user.id, name: client.name });
  }

  const services = await db.consultingService.findMany({
    include: { expertProfile: { select: { userId: true, id: true } } },
  });

  const serviceByExpertEmail = new Map<string, typeof services>();
  for (const service of services) {
    const expert = expertUsers.find((item) => item.profileId === service.expertProfileId);
    if (!expert) continue;
    const list = serviceByExpertEmail.get(expert.seed.email) ?? [];
    list.push(service);
    serviceByExpertEmail.set(expert.seed.email, list);
  }

  function pickService(expertEmail: string, index = 0) {
    const list = serviceByExpertEmail.get(expertEmail)!;
    return list[Math.min(index, list.length - 1)];
  }

  function expertUserId(email: string) {
    return expertUsers.find((item) => item.seed.email === email)!.userId;
  }

  type BookingPlan = {
    expertEmail: string;
    clientIndex: number;
    serviceIndex: number;
    scheduledAt: Date;
    status: string;
    description: string;
    review?: { rating: number; comment: string };
    messages?: { fromExpert: boolean; body: string }[];
  };

  const plans: BookingPlan[] = [
    {
      expertEmail: "abdullah@khabeer.sa",
      clientIndex: 0,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-21, 11),
      status: "COMPLETED",
      description:
        "نحتاج مراجعة هيكل الإدارة المالية بعد التوسع في خطين إنتاجيين جديدين، وتحديد الوظائف المالية المطلوبة.",
      review: {
        rating: 5,
        comment:
          "استشارة عملية جدًا. خرجنا بخطة واضحة لإعادة ترتيب الإدارة المالية، والملاحظات المكتوبة بعد الجلسة كانت مفيدة لفريقنا.",
      },
      messages: [
        { fromExpert: false, body: "السلام عليكم، أرسلت لكم القوائم المالية للسنتين الماضيتين." },
        { fromExpert: true, body: "وعليكم السلام، اطلعت عليها. سنركز في الجلسة على التدفقات النقدية وهيكل التكاليف." },
        { fromExpert: false, body: "ممتاز، هذا بالضبط ما نحتاجه. شكرًا لك." },
      ],
    },
    {
      expertEmail: "abdullah@khabeer.sa",
      clientIndex: 3,
      serviceIndex: 1,
      scheduledAt: daysFromNow(-9, 12),
      status: "COMPLETED",
      description: "أرغب في مراجعة نموذج مالي لمشروع تجاري صغير قبل التقدم لتمويل بنكي.",
      review: {
        rating: 5,
        comment: "أسلوب واضح وخبرة حقيقية. ساعدني في اكتشاف ثغرات في افتراضات النموذج المالي قبل تقديمه للبنك.",
      },
    },
    {
      expertEmail: "munira@khabeer.sa",
      clientIndex: 1,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-14, 18),
      status: "COMPLETED",
      description: "نريد بناء نظام تقييم أداء بسيط لفريق مكوّن من ٤٥ موظفًا في قطاع المقاولات.",
      review: {
        rating: 4,
        comment: "معلومات قيّمة ونماذج جاهزة ساعدتنا في البدء مباشرة. كنت أتمنى وقتًا أطول لمناقشة حالات خاصة.",
      },
      messages: [
        { fromExpert: false, body: "هل نحتاج تجهيز شيء قبل الجلسة؟" },
        { fromExpert: true, body: "أرسل لي الهيكل التنظيمي الحالي ووصف وظيفي لعينة من الوظائف." },
      ],
    },
    {
      expertEmail: "saad@khabeer.sa",
      clientIndex: 1,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-30, 11),
      status: "COMPLETED",
      description: "مشروع سكني متأخر ٥ أشهر عن الجدول الزمني، ونحتاج رأيًا محايدًا في خطة الاسترداد.",
      review: {
        rating: 5,
        comment: "خبرة ميدانية واضحة. وضع يده على أسباب التأخير الحقيقية خلال نصف ساعة، وخرجنا بخطة عملية.",
      },
    },
    {
      expertEmail: "fahad@khabeer.sa",
      clientIndex: 2,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-6, 18),
      status: "COMPLETED",
      description: "نحتاج تقييمًا أوليًا لجاهزيتنا الأمنية قبل تدقيق خارجي مجدول بعد شهرين.",
      review: {
        rating: 5,
        comment: "تشخيص دقيق وترتيب ممتاز للأولويات. وفّر علينا وقتًا كبيرًا قبل التدقيق.",
      },
    },
    {
      expertEmail: "noura@khabeer.sa",
      clientIndex: 0,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-4, 18),
      status: "COMPLETED",
      description: "مراجعة عقد توريد طويل الأجل مع مورد خارجي قبل التوقيع.",
      review: {
        rating: 4,
        comment: "ملاحظات قانونية مهمة على بنود الغرامات والإنهاء. استفدنا كثيرًا.",
      },
    },
    {
      expertEmail: "talal@khabeer.sa",
      clientIndex: 0,
      serviceIndex: 0,
      scheduledAt: daysFromNow(2, 11),
      status: "CONFIRMED",
      description: "ارتفاع تكلفة التوزيع بنسبة ٢٢٪ خلال سنة، ونبحث عن أسباب الهدر في سلسلة الإمداد.",
      messages: [
        { fromExpert: false, body: "أرسلت لك تقرير تكاليف التوزيع لآخر ١٢ شهرًا." },
        { fromExpert: true, body: "وصلني التقرير. سأراجعه قبل الموعد ونبدأ مباشرة بمناقشة النتائج." },
      ],
    },
    {
      expertEmail: "khaled@khabeer.sa",
      clientIndex: 2,
      serviceIndex: 1,
      scheduledAt: daysFromNow(4, 12),
      status: "CONFIRMED",
      description: "نستعد للاعتماد الصحي ونحتاج تحديد الفجوات الأساسية قبل بدء العمل.",
      messages: [{ fromExpert: true, body: "أهلاً بك، جهّز لي قائمة السياسات الحالية لديكم قبل الجلسة." }],
    },
    {
      expertEmail: "reem@khabeer.sa",
      clientIndex: 4,
      serviceIndex: 0,
      scheduledAt: daysFromNow(6, 18),
      status: "CONFIRMED",
      description: "أطلق مشروع منتجات عناية شخصية وأحتاج خطة تسويقية لأول ٩٠ يومًا.",
    },
    {
      expertEmail: "majed@khabeer.sa",
      clientIndex: 0,
      serviceIndex: 0,
      scheduledAt: daysFromNow(3, 10),
      status: "PENDING",
      description: "خط الإنتاج الثاني يعمل بكفاءة ٦٨٪ فقط، ونحتاج رأي خبير قبل قرار الاستثمار في معدات جديدة.",
    },
    {
      expertEmail: "munira@khabeer.sa",
      clientIndex: 2,
      serviceIndex: 1,
      scheduledAt: daysFromNow(5, 18),
      status: "PENDING",
      description: "مراجعة لائحة الموارد البشرية الداخلية ومطابقتها مع نظام العمل بعد توسع الفريق.",
    },
    {
      expertEmail: "omar@khabeer.sa",
      clientIndex: 1,
      serviceIndex: 0,
      scheduledAt: daysFromNow(7, 11),
      status: "PENDING",
      description: "نخطط للحصول على شهادة الأيزو ٩٠٠١ ونحتاج خارطة طريق واقعية.",
    },
    {
      expertEmail: "hind@khabeer.sa",
      clientIndex: 4,
      serviceIndex: 0,
      scheduledAt: daysFromNow(-2, 9),
      status: "REJECTED",
      description: "تصميم برنامج تدريبي لمعلمي مركز تعليمي صغير.",
    },
    {
      expertEmail: "saad@khabeer.sa",
      clientIndex: 3,
      serviceIndex: 1,
      scheduledAt: daysFromNow(9, 11),
      status: "CANCELLED",
      description: "مراجعة عقد مقاولة لمشروع فيلا سكنية.",
    },
  ];

  for (const plan of plans) {
    const service = pickService(plan.expertEmail, plan.serviceIndex);
    const expertId = expertUserId(plan.expertEmail);
    const client = clientUsers[plan.clientIndex];
    const isPast = plan.scheduledAt.getTime() < Date.now();

    const booking = await db.booking.create({
      data: {
        bookingRef: bookingRef(),
        clientId: client.userId,
        expertId,
        serviceId: service.id,
        scheduledAt: plan.scheduledAt,
        durationMinutes: service.durationMinutes,
        priceSar: service.priceSar,
        description: plan.description,
        status: plan.status,
        statusReason:
          plan.status === "REJECTED"
            ? "الموعد المطلوب لا يناسب جدولي حاليًا، يمكنك اختيار موعد آخر."
            : plan.status === "CANCELLED"
              ? "تم الإلغاء بناءً على طلب العميل."
              : null,
        completedAt: plan.status === "COMPLETED" ? plan.scheduledAt : null,
        createdAt: new Date(plan.scheduledAt.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    });

    if (plan.status !== "CANCELLED") {
      await db.payment.create({
        data: {
          bookingId: booking.id,
          amountSar: service.priceSar,
          method: ["MADA", "CARD", "APPLE_PAY"][plan.clientIndex % 3],
          status: plan.status === "REJECTED" ? "REFUNDED" : "PAID",
          transactionRef: `KHB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          cardLast4: ["4212", "7719", "3388"][plan.clientIndex % 3],
          createdAt: booking.createdAt,
        },
      });
    }

    if (plan.status === "CONFIRMED" || plan.status === "COMPLETED") {
      const conversation = await db.conversation.create({
        data: {
          bookingId: booking.id,
          clientId: client.userId,
          expertId,
          createdAt: booking.createdAt,
        },
      });

      const messages = plan.messages ?? [];
      let lastMessageAt: Date | null = null;
      for (const [index, message] of messages.entries()) {
        const createdAt = new Date(booking.createdAt.getTime() + (index + 1) * 3600 * 1000);
        lastMessageAt = createdAt;
        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: message.fromExpert ? expertId : client.userId,
            body: message.body,
            readAt: isPast ? createdAt : index < messages.length - 1 ? createdAt : null,
            createdAt,
          },
        });
      }

      if (lastMessageAt) {
        await db.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt },
        });
      }
    }

    if (plan.review && plan.status === "COMPLETED") {
      await db.review.create({
        data: {
          bookingId: booking.id,
          clientId: client.userId,
          expertId,
          rating: plan.review.rating,
          comment: plan.review.comment,
          createdAt: new Date(plan.scheduledAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Denormalized expert aggregates
  for (const expert of expertUsers) {
    const [aggregate, completed] = await Promise.all([
      db.review.aggregate({
        where: { expertId: expert.userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      db.booking.count({ where: { expertId: expert.userId, status: "COMPLETED" } }),
    ]);

    await db.expertProfile.update({
      where: { id: expert.profileId },
      data: {
        ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
        ratingCount: aggregate._count.rating,
        completedConsultations: completed + (expert.seed.verificationStatus === "VERIFIED" ? 3 : 0),
      },
    });
  }

  await db.favorite.createMany({
    data: [
      { clientId: clientUsers[0].userId, expertId: expertUserId("abdullah@khabeer.sa") },
      { clientId: clientUsers[0].userId, expertId: expertUserId("talal@khabeer.sa") },
      { clientId: clientUsers[3].userId, expertId: expertUserId("noura@khabeer.sa") },
      { clientId: clientUsers[2].userId, expertId: expertUserId("khaled@khabeer.sa") },
    ],
  });

  const recentBookings = await db.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, expert: true, service: true },
    take: 8,
  });

  for (const booking of recentBookings) {
    if (booking.status === "PENDING") {
      await db.notification.create({
        data: {
          userId: booking.expertId,
          type: "BOOKING_REQUESTED",
          title: "طلب استشارة جديد",
          body: `${booking.client.name} أرسل طلب استشارة: ${booking.service.name}`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
        },
      });
      await db.notification.create({
        data: {
          userId: booking.clientId,
          type: "PAYMENT_SUCCESS",
          title: "تمت عملية الدفع بنجاح",
          body: `تم استلام مبلغ الاستشارة رقم ${booking.bookingRef}`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
          isRead: true,
        },
      });
    }

    if (booking.status === "CONFIRMED") {
      await db.notification.create({
        data: {
          userId: booking.clientId,
          type: "BOOKING_ACCEPTED",
          title: "تم قبول طلب الاستشارة",
          body: `قبل ${booking.expert.name} طلبك، ويمكنك الآن التواصل معه عبر الرسائل.`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
        },
      });
    }

    if (booking.status === "REJECTED") {
      await db.notification.create({
        data: {
          userId: booking.clientId,
          type: "BOOKING_REJECTED",
          title: "تم رفض طلب الاستشارة",
          body: `اعتذر ${booking.expert.name} عن الموعد المطلوب، وتم استرجاع المبلغ.`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
        },
      });
    }

    if (booking.status === "COMPLETED") {
      await db.notification.create({
        data: {
          userId: booking.expertId,
          type: "NEW_REVIEW",
          title: "تم استلام تقييم جديد",
          body: `${booking.client.name} قيّم استشارتك.`,
          linkUrl: `/dashboard/expert/reviews`,
          relatedId: booking.id,
          isRead: true,
        },
      });
    }
  }

  const summary = {
    categories: await db.category.count(),
    experts: await db.user.count({ where: { role: "EXPERT" } }),
    clients: await db.user.count({ where: { role: "CLIENT" } }),
    services: await db.consultingService.count(),
    bookings: await db.booking.count(),
    reviews: await db.review.count(),
    messages: await db.message.count(),
    notifications: await db.notification.count(),
  };

  console.log("✅ تم إنشاء البيانات التجريبية:", summary);
  console.log(`🔑 كلمة المرور لجميع الحسابات التجريبية: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
