export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الأحساء",
  "الطائف",
  "بريدة",
  "عنيزة",
  "حائل",
  "تبوك",
  "أبها",
  "خميس مشيط",
  "نجران",
  "جازان",
  "الجبيل",
  "ينبع",
  "عرعر",
] as const;

export const WEEK_DAYS = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الاثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
] as const;

export const SEED_CATEGORIES = [
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
] as const;

export const EXPERTS_PAGE_SIZE = 9;
export const BOOKING_WINDOW_DAYS = 21;
export const SLOT_STEP_MINUTES = 30;
