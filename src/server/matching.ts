import { db } from "@/lib/db";
import { rankExperts } from "@/lib/ai";
import { normalizeArabic } from "@/lib/ai/lexicon";
import type { CandidateRef, ProblemBrief } from "@/lib/ai";

export const SHORTLIST_SIZE = 8;
export const MATCH_COUNT = 3;

/** Median service price per category slug — feeds the brief's budget range. */
export async function getCategoryPriceHints(): Promise<Record<string, number>> {
  const rows = await db.consultingService.findMany({
    where: { isActive: true },
    select: {
      priceSar: true,
      durationMinutes: true,
      expertProfile: { select: { categories: { select: { category: { select: { slug: true } } } } } },
    },
  });

  const buckets = new Map<string, number[]>();
  for (const row of rows) {
    if (row.durationMinutes <= 0) continue;
    const hourly = Math.round((row.priceSar / row.durationMinutes) * 60);
    for (const link of row.expertProfile.categories) {
      const list = buckets.get(link.category.slug) ?? [];
      list.push(hourly);
      buckets.set(link.category.slug, list);
    }
  }

  const hints: Record<string, number> = {};
  for (const [slug, prices] of buckets) {
    prices.sort((a, b) => a - b);
    hints[slug] = prices[Math.floor(prices.length / 2)];
  }
  return hints;
}

type ScoredCandidate = CandidateRef & { score: number; inField: boolean };

/**
 * Stage one of matching: a plain database query plus explicit weights. The model
 * never sees the full roster — it only reorders and explains this shortlist, which
 * keeps the result fast, cheap, and impossible to hallucinate an expert into.
 */
export async function shortlistExperts(
  brief: Omit<ProblemBrief, "engine">,
  problemText: string,
): Promise<ScoredCandidate[]> {
  const profiles = await db.expertProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      user: { status: "ACTIVE" },
      services: { some: { isActive: true } },
    },
    select: {
      userId: true,
      headline: true,
      bio: true,
      previousTitle: true,
      previousOrganization: true,
      yearsOfExperience: true,
      city: true,
      ratingAvg: true,
      minPriceSar: true,
      user: { select: { name: true } },
      skills: { select: { name: true } },
      categories: { select: { category: { select: { name: true, slug: true } } } },
    },
  });

  const needle = normalizeArabic(`${problemText} ${brief.keySkills.join(" ")}`);
  const terms = new Set(
    brief.keySkills.flatMap((skill) =>
      normalizeArabic(skill)
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 3),
    ),
  );

  const scored = profiles.map((profile) => {
    const slugs = profile.categories.map((link) => link.category.slug);
    const inField = Boolean(brief.categorySlug) && slugs.includes(brief.categorySlug!);
    let score = 0;

    // Field match — the single strongest signal. A track record in the wrong field
    // must never outrank a weaker record in the right one, so a miss is penalised
    // rather than merely unrewarded.
    if (inField) score += 40;
    else if (brief.categorySlug) score -= 30;

    // Overlap between the required skills and this expert's own words.
    const haystack = normalizeArabic(
      [profile.headline, profile.bio, profile.previousTitle, profile.previousOrganization,
        ...profile.skills.map((skill) => skill.name)].filter(Boolean).join(" "),
    );
    // Carries most of the spread: seniority saturates across a roster of veterans,
    // but how squarely someone's own skills hit this problem does not.
    let hits = 0;
    for (const term of terms) if (haystack.includes(term)) hits += 1;
    for (const skill of profile.skills) {
      if (needle.includes(normalizeArabic(skill.name))) hits += 2;
    }
    score += Math.min(35, hits * 6);

    // Track record.
    score += Math.min(12, profile.ratingAvg * 2.4);
    score += Math.min(8, profile.yearsOfExperience / 4);

    // Budget fit — a fair price for the stated range, not simply the cheapest.
    if (profile.minPriceSar !== null) {
      if (profile.minPriceSar <= brief.budgetMaxSar) score += 5;
      else if (profile.minPriceSar <= brief.budgetMaxSar * 1.3) score += 2;
    }

    return {
      id: profile.userId,
      name: profile.user.name,
      headline: profile.headline,
      previousTitle: profile.previousTitle,
      previousOrganization: profile.previousOrganization,
      yearsOfExperience: profile.yearsOfExperience,
      city: profile.city,
      ratingAvg: profile.ratingAvg,
      minPriceSar: profile.minPriceSar,
      skills: profile.skills.map((skill) => skill.name),
      categories: profile.categories.map((link) => link.category.name),
      inField,
      score: Math.max(0, Math.min(100, Math.round(score))),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, SHORTLIST_SIZE);
}

export type MatchedExpert = {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  previousTitle: string | null;
  previousOrganization: string | null;
  yearsOfExperience: number;
  city: string | null;
  ratingAvg: number;
  ratingCount: number;
  minPriceSar: number | null;
  reason: string;
  score: number;
};

/**
 * Stage two: the shortlist is reordered and explained. The ranking is deliberately
 * not persisted — the roster grows as experts join, so a shared link stays current.
 */
export async function getMatchesForRequest(requestId: string): Promise<MatchedExpert[]> {
  const request = await db.consultationRequest.findUnique({
    where: { id: requestId },
    include: { category: { select: { slug: true } } },
  });
  if (!request) return [];

  const brief = {
    categorySlug: request.category?.slug ?? null,
    reframedQuestion: request.reframedQuestion,
    keySkills: request.keySkills,
    questionsToAsk: request.questionsToAsk,
    suggestedMinutes: request.suggestedMinutes as 30 | 45 | 60 | 90,
    budgetMinSar: request.budgetMinSar,
    budgetMaxSar: request.budgetMaxSar,
  };

  const all = await shortlistExperts(brief, request.rawText);
  // Padding the list with experts from another field would be worse than a short
  // list, so off-field candidates only appear when the field itself is thin.
  const inField = all.filter((candidate) => candidate.inField);
  const candidates = inField.length >= MATCH_COUNT ? inField : all;
  if (candidates.length === 0) return [];

  const { matches } = await rankExperts({ brief, problemText: request.rawText, candidates });
  const scoreById = new Map(candidates.map((candidate) => [candidate.id, candidate.score]));

  const profiles = await db.user.findMany({
    where: { id: { in: matches.map((match) => match.expertId) } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      expertProfile: {
        select: {
          headline: true,
          previousTitle: true,
          previousOrganization: true,
          yearsOfExperience: true,
          city: true,
          ratingAvg: true,
          ratingCount: true,
          minPriceSar: true,
        },
      },
    },
  });

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return matches.flatMap((match) => {
    const profile = byId.get(match.expertId);
    if (!profile?.expertProfile) return [];
    const expert = profile.expertProfile;
    return [
      {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        headline: expert.headline,
        previousTitle: expert.previousTitle,
        previousOrganization: expert.previousOrganization,
        yearsOfExperience: expert.yearsOfExperience,
        city: expert.city,
        ratingAvg: expert.ratingAvg,
        ratingCount: expert.ratingCount,
        minPriceSar: expert.minPriceSar,
        reason: match.reason,
        // The displayed score is the deterministic one — it is derived from real
        // fields and stays comparable between requests.
        score: scoreById.get(profile.id) ?? match.score,
      },
    ];
  });
}
