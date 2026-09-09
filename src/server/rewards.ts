import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { notify } from "@/server/notifications";
import { BADGES, VOUCHERS, currentBadge } from "@/lib/rewards";
import { formatSar } from "@/lib/format";

/** Human-readable and hard to guess: KHB-JARIR-4F9C2A */
function makeCode(tierKey: string): string {
  return `KHB-${tierKey.split("-")[0].toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Grants any milestone the expert has newly reached.
 *
 * Called after a consultation completes. The unique constraint on
 * (expertId, tierKey) is what makes this safe to call more than once — a
 * duplicate grant fails at the database rather than relying on the caller
 * to have counted correctly.
 */
export async function grantRewards(expertId: string): Promise<{ vouchers: number; badge: string | null }> {
  const completed = await db.booking.count({ where: { expertId, status: "COMPLETED" } });

  // The stored counter is what the public profile and the badge read from, and a
  // booking becomes COMPLETED by time passing rather than by an action — so
  // nothing else would ever bring it up to date.
  await db.expertProfile.updateMany({
    where: { userId: expertId },
    data: { completedConsultations: completed },
  });

  const alreadyEarned = await db.rewardVoucher.findMany({
    where: { expertId },
    select: { tierKey: true },
  });
  const held = new Set(alreadyEarned.map((row) => row.tierKey));

  let granted = 0;
  for (const tier of VOUCHERS) {
    if (completed < tier.threshold || held.has(tier.key)) continue;

    try {
      await db.rewardVoucher.create({
        data: {
          expertId,
          tierKey: tier.key,
          partner: tier.partner,
          valueSar: tier.valueSar,
          code: makeCode(tier.key),
        },
      });
      granted += 1;

      await notify({
        userId: expertId,
        type: "REWARD_EARNED",
        title: "حصلت على مكافأة",
        body: `أنجزت ${tier.threshold} استشارات، واستحققت ${tier.description} بقيمة ${formatSar(tier.valueSar)}.`,
        linkUrl: "/dashboard/expert/rewards",
        relatedId: tier.key,
      });
    } catch {
      // Unique constraint: another request granted it first. Nothing to do.
    }
  }

  // A badge is derived from the count rather than stored, so it needs no row —
  // but crossing one is still worth telling the expert about.
  const badge = BADGES.find((entry) => entry.threshold === completed);
  if (badge) {
    await notify({
      userId: expertId,
      type: "BADGE_EARNED",
      title: `وسام جديد: ${badge.name}`,
      body: `${badge.description}. يظهر الوسام بجانب اسمك للعملاء.`,
      linkUrl: "/dashboard/expert/rewards",
      relatedId: badge.key,
    });
  }

  return { vouchers: granted, badge: currentBadge(completed)?.key ?? null };
}

export async function getExpertRewards(expertId: string) {
  const [completed, vouchers] = await Promise.all([
    db.booking.count({ where: { expertId, status: "COMPLETED" } }),
    db.rewardVoucher.findMany({ where: { expertId }, orderBy: { earnedAt: "desc" } }),
  ]);

  return { completed, vouchers };
}

/** Public badge for an expert's profile card — count only, no voucher data. */
export async function getBadgeFor(expertId: string) {
  const completed = await db.booking.count({ where: { expertId, status: "COMPLETED" } });
  return currentBadge(completed);
}
