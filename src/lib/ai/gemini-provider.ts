import { z } from "zod";
import {
  problemBriefSchema,
  rankedMatchSchema,
  type AiProvider,
  type AssistantInput,
  type CandidateRef,
  type CategoryRef,
  type ProblemBrief,
  type RankedMatch,
} from "./provider";
import { ANALYZE_SYSTEM, ASSISTANT_SYSTEM, RANK_SYSTEM, buildAnalyzeUser, buildRankUser } from "./prompts";

/**
 * Google Gemini, called over plain REST so no SDK dependency is needed.
 *
 * Models are tried in order. Two things measured on a real key made this
 * necessary rather than tidy: Google retires model ids for new accounts
 * (`gemini-2.5-flash` already 404s), and free-tier models return 503 under load.
 * A single hard-coded id would take the whole feature down in both cases.
 */
const MODELS = ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-pro"];

/**
 * Ranking is the easy half of the work — reorder eight candidates and write one
 * sentence each — but it carries the longest prompt, and on the free tier the
 * bigger model took 14s and blew the timeout. The lighter model does it in about
 * two, so speed leads here while quality still leads for analysis.
 */
const RANK_MODELS = ["gemini-3.1-flash-lite", "gemini-3.7-flash"];

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiReply = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
};

export class GeminiAiProvider implements AiProvider {
  readonly name = "gemini" as const;

  constructor(private apiKey: string) {}

  private async generate(
    system: string,
    user: string,
    options: {
      json: boolean;
      maxTokens: number;
      history?: AssistantInput["history"];
      models?: readonly string[];
    },
  ): Promise<string> {
    let lastError = "";

    for (const model of options.models ?? MODELS) {
      try {
        const response = await fetch(`${ENDPOINT}/${model}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [
              ...(options.history ?? []).slice(-6).map((turn) => ({
                // Gemini names the assistant side "model", not "assistant".
                role: turn.role === "assistant" ? "model" : "user",
                parts: [{ text: turn.content }],
              })),
              { role: "user", parts: [{ text: user }] },
            ],
            generationConfig: {
              maxOutputTokens: options.maxTokens,
              temperature: 0.4,
              ...(options.json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        });

        if (!response.ok) {
          lastError = `${model}: ${response.status}`;
          continue; // retired id or an overloaded model — try the next one
        }

        const data = (await response.json()) as GeminiReply;
        const text =
          data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

        if (!text.trim()) {
          lastError = `${model}: empty reply`;
          continue;
        }
        return text;
      } catch (error) {
        lastError = `${model}: ${(error as Error).message}`;
      }
    }

    throw new Error(`gemini exhausted every model (${lastError})`);
  }

  async analyzeProblem(input: {
    text: string;
    categories: CategoryRef[];
    priceHints: Record<string, number>;
  }): Promise<Omit<ProblemBrief, "engine">> {
    const reply = await this.generate(ANALYZE_SYSTEM, buildAnalyzeUser(input), {
      json: true,
      maxTokens: 2000,
    });

    const brief = problemBriefSchema.parse(JSON.parse(reply));
    const allowed = new Set(input.categories.map((category) => category.slug));

    return {
      ...brief,
      categorySlug:
        brief.categorySlug && allowed.has(brief.categorySlug) ? brief.categorySlug : null,
      budgetMaxSar: Math.max(brief.budgetMaxSar, brief.budgetMinSar + 100),
    };
  }

  async rankExperts(input: {
    brief: Omit<ProblemBrief, "engine">;
    problemText: string;
    candidates: CandidateRef[];
  }): Promise<RankedMatch[]> {
    const reply = await this.generate(RANK_SYSTEM, buildRankUser(input), {
      json: true,
      maxTokens: 2000,
      models: RANK_MODELS,
    });

    const parsed = z
      .object({ matches: z.array(rankedMatchSchema).min(1) })
      .parse(JSON.parse(reply));

    const allowed = new Set(input.candidates.map((candidate) => candidate.id));
    const matches = parsed.matches.filter((match) => allowed.has(match.expertId)).slice(0, 3);

    // A reply that invented ids is not a partial success — fall back to the
    // deterministic order rather than showing an expert who does not exist.
    if (matches.length < Math.min(3, input.candidates.length)) {
      throw new Error("model returned unknown expert ids");
    }

    return matches;
  }

  async answerAssistant(input: AssistantInput): Promise<string> {
    return this.generate(
      [
        ASSISTANT_SYSTEM,
        `\n\n### معلومات المنصة\n${input.platformBrief}`,
        `\n\n### بيانات حساب المستخدم الحالي\n${input.accountContext}`,
      ].join(""),
      input.question,
      { json: false, maxTokens: 800, history: input.history },
    ).then((text) => text.trim());
  }
}
