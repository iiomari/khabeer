import { z } from "zod";

/** Categories are passed in from the database so the model can only pick a real one. */
export type CategoryRef = { id: string; name: string; slug: string };

/** A compact view of one shortlisted expert — everything the model needs, nothing more. */
export type CandidateRef = {
  id: string;
  name: string;
  headline: string | null;
  previousTitle: string | null;
  previousOrganization: string | null;
  yearsOfExperience: number;
  city: string | null;
  ratingAvg: number;
  minPriceSar: number | null;
  skills: string[];
  categories: string[];
};

export const problemBriefSchema = z.object({
  /** Slug of the matched category, or null when nothing fits. */
  categorySlug: z.string().nullable(),
  /** The client's problem restated as the question an expert should actually answer. */
  reframedQuestion: z.string().min(5).max(400),
  keySkills: z.array(z.string().min(1).max(60)).min(1).max(6),
  questionsToAsk: z.array(z.string().min(5).max(200)).min(3).max(5),
  suggestedMinutes: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  budgetMinSar: z.number().int().positive(),
  budgetMaxSar: z.number().int().positive(),
});

export type ProblemBrief = z.infer<typeof problemBriefSchema> & { engine: AiEngine };

export const rankedMatchSchema = z.object({
  expertId: z.string().min(1),
  /** One sentence in Arabic tying this expert's real background to the problem. */
  reason: z.string().min(10).max(240),
  score: z.number().int().min(0).max(100),
});

export type RankedMatch = z.infer<typeof rankedMatchSchema>;

export type AiEngine = "claude" | "heuristic";

export interface AiProvider {
  readonly name: AiEngine;
  analyzeProblem(input: {
    text: string;
    categories: CategoryRef[];
    /** Median service price per category slug, so budgets track real market prices. */
    priceHints: Record<string, number>;
  }): Promise<Omit<ProblemBrief, "engine">>;
  rankExperts(input: {
    brief: Omit<ProblemBrief, "engine">;
    problemText: string;
    candidates: CandidateRef[];
  }): Promise<RankedMatch[]>;
}
