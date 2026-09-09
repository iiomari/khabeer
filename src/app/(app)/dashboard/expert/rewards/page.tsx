import type { Metadata } from "next";
import { Award, Crown, Gift, Medal, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/server/session";
import { getExpertRewards, grantRewards } from "@/server/rewards";
import {
  BADGES,
  VOUCHERS,
  currentBadge,
  earnedBadges,
  nextBadge,
  nextVoucher,
  progressToNext,
} from "@/lib/rewards";
import { formatNumber, formatSar, formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: t.rewards.title };

const ICONS: Record<string, typeof Award> = { Sparkles, ShieldCheck, Award, Medal, Crown };

export default async function ExpertRewardsPage() {
  const user = await requireRole("EXPERT");

  // Completion is derived from time passing rather than an explicit action, so
  // there is no event to hang the grant on. Catching up on read keeps the ledger
  // correct without a scheduler.
  await grantRewards(user.id);
  const { completed, vouchers } = await getExpertRewards(user.id);

  const held = currentBadge(completed);
  const earned = earnedBadges(completed);
  const nextB = nextBadge(completed);
  const nextV = nextVoucher(completed);
  const progress = progressToNext(completed);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.rewards.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.rewards.subtitle}</p>
      </header>

      {/* ── where the expert stands ─────────────────────────────── */}
      <Card className="gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t.rewards.completedLabel}</p>
            <p className="text-4xl font-bold text-primary">{formatNumber(completed)}</p>
          </div>

          {held ? (
            <div className="text-end">
              <p className="text-sm text-muted-foreground">{t.rewards.currentBadge}</p>
              <Badge className={cn("mt-1 gap-1.5 border px-3 py-1.5 text-sm", held.tone)}>
                {(() => {
                  const Icon = ICONS[held.icon] ?? Award;
                  return <Icon className="size-4" />;
                })()}
                {held.name}
              </Badge>
            </div>
          ) : null}
        </div>

        {nextV || nextB ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {nextV
                  ? t.rewards.nextVoucher(nextV.remaining, nextV.voucher.partner)
                  : t.rewards.nextBadge(nextB!.remaining, nextB!.badge.name)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatNumber(completed)} / {formatNumber(progress.to)}
              </span>
            </div>
            <Progress value={progress.percent} />
          </div>
        ) : (
          <p className="text-sm font-medium text-success">{t.rewards.allDone}</p>
        )}
      </Card>

      {/* ── vouchers earned ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold">
            <Ticket className="size-5 text-accent" />
            {t.rewards.vouchersTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.rewards.vouchersHint}</p>
        </div>

        {vouchers.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={t.rewards.noVouchers}
            description={
              nextV ? t.rewards.nextVoucher(nextV.remaining, nextV.voucher.partner) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {vouchers.map((voucher) => (
              <li key={voucher.id}>
                <Card className="gap-3 border-accent/30 bg-accent/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{voucher.partner}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(voucher.earnedAt)}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-accent">
                      {formatSar(voucher.valueSar)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-dashed bg-background px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t.rewards.code}</p>
                    <p dir="ltr" className="mt-0.5 font-mono text-base font-bold tracking-wider">
                      {voucher.code}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      {/* ── the badge ladder ────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold">
            <Medal className="size-5 text-primary" />
            {t.rewards.badgesTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.rewards.badgesHint}</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => {
            const has = earned.some((entry) => entry.key === badge.key);
            const Icon = ICONS[badge.icon] ?? Award;
            return (
              <li key={badge.key}>
                <Card className={cn("flex-row items-start gap-3 p-4", !has && "opacity-55")}>
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                      has ? badge.tone : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    {!has ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.rewards.remaining(badge.threshold - completed)}
                      </p>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── the whole ladder, so the goal is visible from day one ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t.rewards.ladderTitle}</h2>
        <Card className="gap-0 divide-y p-0">
          {VOUCHERS.map((tier) => {
            const has = completed >= tier.threshold;
            return (
              <div key={tier.key} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      has ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {formatNumber(tier.threshold)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{tier.description}</p>
                    <p className="text-xs text-muted-foreground">{tier.partner}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    has ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {formatSar(tier.valueSar)}
                </span>
              </div>
            );
          })}
        </Card>
        <p className="text-xs text-muted-foreground">{t.rewards.demoNote}</p>
      </section>
    </div>
  );
}
