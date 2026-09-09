import Anthropic from "@anthropic-ai/sdk";
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
import {
  ANALYZE_SYSTEM,
  ASSISTANT_SYSTEM,
  RANK_SYSTEM,
  buildAnalyzeUser,
  buildRankUser,
} from "./prompts";

const MODEL = "claude-opus-5";

/** Pulls the first JSON object out of a reply, tolerating stray prose or fences. */
function parseJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object in model reply");
  return JSON.parse(candidate.slice(start, end + 1));
}

export class AnthropicAiProvider implements AiProvider {
  readonly name = "claude" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, maxRetries: 1 });
  }

  private async complete(
    system: string,
    user: string,
    maxTokens: number,
    history: AssistantInput["history"] = [],
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [
        ...history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content })),
        { role: "user" as const, content: user },
      ],
    });

    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  }

  async analyzeProblem(input: {
    text: string;
    categories: CategoryRef[];
    priceHints: Record<string, number>;
  }): Promise<Omit<ProblemBrief, "engine">> {
    const reply = await this.complete(ANALYZE_SYSTEM, buildAnalyzeUser(input), 1200);
    const brief = problemBriefSchema.parse(parseJson(reply));
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
    const reply = await this.complete(RANK_SYSTEM, buildRankUser(input), 1200);
    const parsed = z.object({ matches: z.array(rankedMatchSchema).min(1) }).parse(parseJson(reply));

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
    return this.complete(
      [
        ASSISTANT_SYSTEM,
        `\n\n### معلومات المنصة\n${input.platformBrief}`,
        `\n\n### بيانات حساب المستخدم الحالي\n${input.accountContext}`,
      ].join(""),
      input.question,
      400,
      input.history,
    );
  }
}
