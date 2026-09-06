"use server";

import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { analyzeProblem } from "@/lib/ai";
import { normalizeArabic } from "@/lib/ai/lexicon";
import { getCategoryPriceHints } from "@/server/matching";
import { getCurrentUser } from "@/server/session";
import { problemSchema } from "@/lib/validation";
import { t } from "@/lib/i18n/ar";

export type MatchResult = { ok: true; requestId: string } | { ok: false; error: string };

/** Identical problems within the hour reuse their brief — cheaper, and instant on a demo replay. */
const CACHE_WINDOW_MS = 60 * 60 * 1000;

export async function analyzeProblemAction(input: unknown): Promise<MatchResult> {
  const parsed = problemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const text = parsed.data.text;
  const textHash = createHash("sha256").update(normalizeArabic(text)).digest("hex");
  const user = await getCurrentUser();
  const clientId = user?.role === "CLIENT" ? user.id : null;

  try {
    const cached = await db.consultationRequest.findFirst({
      where: { textHash, createdAt: { gt: new Date(Date.now() - CACHE_WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (cached) return { ok: true, requestId: cached.id };

    const [categories, priceHints] = await Promise.all([
      db.category.findMany({ select: { id: true, name: true, slug: true } }),
      getCategoryPriceHints(),
    ]);

    const brief = await analyzeProblem({ text, categories, priceHints });
    const category = categories.find((item) => item.slug === brief.categorySlug) ?? null;

    const request = await db.consultationRequest.create({
      data: {
        clientId,
        rawText: text,
        textHash,
        categoryId: category?.id ?? null,
        reframedQuestion: brief.reframedQuestion,
        keySkills: brief.keySkills,
        questionsToAsk: brief.questionsToAsk,
        suggestedMinutes: brief.suggestedMinutes,
        budgetMinSar: brief.budgetMinSar,
        budgetMaxSar: brief.budgetMaxSar,
        engine: brief.engine,
      },
      select: { id: true },
    });

    return { ok: true, requestId: request.id };
  } catch (error) {
    console.error("[match] analyze failed:", error);
    return { ok: false, error: t.common.somethingWentWrong };
  }
}

