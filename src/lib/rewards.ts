/**
 * Milestones that reward an expert for staying active on the platform.
 *
 * Two separate ladders on purpose:
 *  - **Badges** are public and permanent — they sit next to the expert's name and
 *    tell a client "this person has actually done this work here". They cannot be
 *    spent, so they never lose meaning.
 *  - **Vouchers** are private and one-off — a thank-you the expert redeems.
 *
 * Both count only COMPLETED consultations. Counting bookings would reward an
 * expert for accepting work and never delivering it.
 */

export type Badge = {
  key: string;
  /** Completed consultations required. */
  threshold: number;
  name: string;
  description: string;
  /** Lucide icon name. */
  icon: string;
  /** Tailwind classes for the badge chip. */
  tone: string;
};

export const BADGES: Badge[] = [
  {
    key: "first-steps",
    threshold: 1,
    name: "أول استشارة",
    description: "أنجز أول استشارة على المنصة",
    icon: "Sparkles",
    tone: "bg-muted text-muted-foreground border-border",
  },
  {
    key: "trusted",
    threshold: 5,
    name: "خبير موثوق",
    description: "أنجز خمس استشارات",
    icon: "ShieldCheck",
    tone: "bg-brand-soft text-primary border-primary/25",
  },
  {
    key: "seasoned",
    threshold: 10,
    name: "خبير متمرّس",
    description: "أنجز عشر استشارات",
    icon: "Award",
    tone: "bg-accent/12 text-accent border-accent/30",
  },
  {
    key: "reference",
    threshold: 25,
    name: "مرجع في مجاله",
    description: "أنجز خمسًا وعشرين استشارة",
    icon: "Medal",
    tone: "bg-success/12 text-success border-success/30",
  },
  {
    key: "cornerstone",
    threshold: 50,
    name: "ركيزة المنصة",
    description: "أنجز خمسين استشارة",
    icon: "Crown",
    tone: "bg-primary text-primary-foreground border-primary",
  },
];

export type VoucherTier = {
  key: string;
  threshold: number;
  /** The partner whose voucher this is. */
  partner: string;
  valueSar: number;
  description: string;
};

export const VOUCHERS: VoucherTier[] = [
  { key: "jarir-100", threshold: 3, partner: "مكتبة جرير", valueSar: 100, description: "قسيمة شراء من مكتبة جرير" },
  { key: "extra-150", threshold: 7, partner: "إكسترا", valueSar: 150, description: "قسيمة شراء من إكسترا" },
  { key: "fuel-200", threshold: 15, partner: "محطات الوقود", valueSar: 200, description: "بطاقة وقود" },
  { key: "hotel-400", threshold: 30, partner: "إقامة فندقية", valueSar: 400, description: "ليلة فندقية داخل المملكة" },
];

/** The badge an expert currently holds — the highest one they have reached. */
export function currentBadge(completed: number): Badge | null {
  return [...BADGES].reverse().find((badge) => completed >= badge.threshold) ?? null;
}

export function earnedBadges(completed: number): Badge[] {
  return BADGES.filter((badge) => completed >= badge.threshold);
}

/** The next badge to aim for, with how far away it is. */
export function nextBadge(completed: number): { badge: Badge; remaining: number } | null {
  const badge = BADGES.find((entry) => completed < entry.threshold);
  return badge ? { badge, remaining: badge.threshold - completed } : null;
}

export function earnedVouchers(completed: number): VoucherTier[] {
  return VOUCHERS.filter((voucher) => completed >= voucher.threshold);
}

export function nextVoucher(completed: number): { voucher: VoucherTier; remaining: number } | null {
  const voucher = VOUCHERS.find((entry) => completed < entry.threshold);
  return voucher ? { voucher, remaining: voucher.threshold - completed } : null;
}

/** Progress toward the next milestone of either ladder, for the progress bar. */
export function progressToNext(completed: number): { from: number; to: number; percent: number } {
  const next = nextVoucher(completed)?.voucher.threshold ?? nextBadge(completed)?.badge.threshold;
  if (!next) return { from: completed, to: completed, percent: 100 };

  const thresholds = [0, ...VOUCHERS.map((v) => v.threshold), ...BADGES.map((b) => b.threshold)]
    .filter((value) => value < next)
    .sort((a, b) => b - a);
  const from = thresholds[0] ?? 0;

  return {
    from,
    to: next,
    percent: Math.round(((completed - from) / (next - from)) * 100),
  };
}
