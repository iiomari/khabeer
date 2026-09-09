import { findHelpEntry } from "./assistant-knowledge";
import {
  CATEGORY_SIGNALS,
  FALLBACK_SIGNALS,
  normalizeArabic,
  scoreCategories,
} from "./lexicon";
import type { AiProvider, CandidateRef, ProblemBrief, RankedMatch } from "./provider";

/** Words too common to carry meaning when we intersect a problem with an expert's background. */
const STOP_WORDS = new Set(
  [
    "في", "من", "على", "الى", "عن", "مع", "هذا", "هذه", "التي", "الذي", "كان", "عندنا", "عندي",
    "لدينا", "نحتاج", "احتاج", "نريد", "اريد", "كيف", "ليش", "لماذا", "ولا", "لكن", "او", "ثم",
    "قبل", "بعد", "كل", "بعض", "جدا", "شركة", "شركه", "منشاة", "منشاه", "عمل", "مشكلة", "مشكله",
  ].map(normalizeArabic),
);

function extractTerms(text: string): string[] {
  return normalizeArabic(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function roundToFifty(value: number): number {
  return Math.max(50, Math.round(value / 50) * 50);
}

/**
 * Deterministic engine. Every field it produces is derived from something real:
 * the category from the Arabic lexicon, the budget from live median prices in that
 * category, the questions from the field's own opening checklist. It never calls out,
 * so it is also the thing that runs when the network or the API key is gone.
 */
export class HeuristicAiProvider implements AiProvider {
  readonly name = "heuristic" as const;

  async analyzeProblem(input: {
    text: string;
    categories: { id: string; name: string; slug: string }[];
    priceHints: Record<string, number>;
  }): Promise<Omit<ProblemBrief, "engine">> {
    const known = new Set(input.categories.map((category) => category.slug));
    const ranked = scoreCategories(input.text).filter((entry) => known.has(entry.slug));
    const best = ranked[0];
    const slug = best && best.score > 0 ? best.slug : null;
    const signals = (slug ? CATEGORY_SIGNALS[slug] : null) ?? FALLBACK_SIGNALS;

    const median = (slug ? input.priceHints[slug] : undefined) ?? 600;
    const hourly = median * (signals.minutes / 60);

    const firstSentence = input.text
      .replace(/\s+/g, " ")
      .trim()
      .split(/[.؟!\n]/)[0]
      .slice(0, 220)
      .trim();

    return {
      categorySlug: slug,
      reframedQuestion: firstSentence
        ? `ما الأسباب الجذرية وراء: «${firstSentence}»، وما الخطوات العملية لمعالجتها؟`
        : "ما التشخيص الدقيق لهذه الحالة وما الخطوات العملية لمعالجتها؟",
      keySkills: signals.skills.slice(0, 4),
      questionsToAsk: signals.questions.slice(0, 4),
      suggestedMinutes: signals.minutes,
      budgetMinSar: roundToFifty(hourly * 0.8),
      budgetMaxSar: roundToFifty(hourly * 1.35),
    };
  }

  async rankExperts(input: {
    brief: Omit<ProblemBrief, "engine">;
    problemText: string;
    candidates: CandidateRef[];
  }): Promise<RankedMatch[]> {
    const terms = new Set([
      ...extractTerms(input.problemText),
      ...input.brief.keySkills.flatMap(extractTerms),
    ]);

    return input.candidates.slice(0, 3).map((candidate, index) => {
      const role = candidate.previousTitle
        ? candidate.previousOrganization
          ? `${candidate.previousTitle} في ${candidate.previousOrganization}`
          : candidate.previousTitle
        : (candidate.headline ?? "خبير موثّق");

      // Only claim a direct tie when one of this expert's own skills genuinely
      // overlaps the problem — an invented link is worse than a plain statement.
      const overlap = candidate.skills.find((skill) =>
        extractTerms(skill).some((term) => terms.has(term)),
      );
      const field = candidate.categories[0];

      // No gender is stored, so the wording stays free of pronouns rather than
      // guessing one and getting it wrong half the time.
      const reason = overlap
        ? `${candidate.yearsOfExperience} سنة خبرة كـ${role} — مع ممارسة مباشرة في ${overlap}.`
        : field
          ? `${candidate.yearsOfExperience} سنة خبرة كـ${role} — والتخصص في ${field} هو الأقرب لطبيعة المشكلة.`
          : `${candidate.yearsOfExperience} سنة خبرة كـ${role} — الأقرب بين خبراء المنصة لهذه الحالة.`;

      return {
        expertId: candidate.id,
        reason,
        score: Math.max(60, 96 - index * 7),
      };
    });
  }

  /**
   * Offline assistant: matches the question against the curated help entries.
   * The caller already appends the link, so this returns prose only.
   */
  async answerAssistant(input: {
    question: string;
    platformBrief: string;
    accountContext: string;
    history: { role: "user" | "assistant"; content: string }[];
  }): Promise<string> {
    const entry = findHelpEntry(input.question);
    return entry?.answer ?? "";
  }
}
