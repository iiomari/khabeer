import { AnthropicAiProvider } from "./anthropic-provider";
import { GeminiAiProvider } from "./gemini-provider";
import { HeuristicAiProvider } from "./heuristic-provider";
import type {
  AiEngine,
  AiProvider,
  AssistantInput,
  CandidateRef,
  CategoryRef,
  ProblemBrief,
  RankedMatch,
} from "./provider";

/** Free-tier Gemini is slower than Claude, so the ceiling covers the slower of the two. */
const TIMEOUT_MS = 14_000;

const heuristic = new HeuristicAiProvider();
let configured: AiProvider | null = null;

/**
 * One place decides which engine runs. Anthropic wins when both keys are set;
 * otherwise Gemini; otherwise the offline engine, which always works.
 */
function getPrimary(): AiProvider {
  if (configured) return configured;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    configured = new AnthropicAiProvider(anthropicKey);
    return configured;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    configured = new GeminiAiProvider(geminiKey);
    return configured;
  }

  return heuristic;
}

/** Which engine is configured — used only to label results honestly in the UI. */
export function activeEngine(): AiEngine {
  return getPrimary().name;
}

export function isAiConfigured(): boolean {
  return getPrimary().name !== "heuristic";
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("ai timeout")), TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Runs the configured engine and drops to the offline engine on any failure —
 * missing key, network error, timeout, malformed JSON, invented expert ids.
 * The caller always gets a usable result and learns which engine produced it.
 */
async function run<T>(
  primary: (provider: AiProvider) => Promise<T>,
  fallback: () => Promise<T>,
): Promise<{ value: T; engine: AiEngine }> {
  const provider = getPrimary();
  if (provider.name === "heuristic") return { value: await fallback(), engine: "heuristic" };

  try {
    return { value: await withTimeout(primary(provider)), engine: provider.name };
  } catch (error) {
    console.error(`[ai] ${provider.name} failed, using the offline engine:`, error);
    return { value: await fallback(), engine: "heuristic" };
  }
}

export async function analyzeProblem(input: {
  text: string;
  categories: CategoryRef[];
  priceHints: Record<string, number>;
}): Promise<ProblemBrief> {
  const { value, engine } = await run(
    (provider) => provider.analyzeProblem(input),
    () => heuristic.analyzeProblem(input),
  );
  return { ...value, engine };
}

export async function rankExperts(input: {
  brief: Omit<ProblemBrief, "engine">;
  problemText: string;
  candidates: CandidateRef[];
}): Promise<{ matches: RankedMatch[]; engine: AiEngine }> {
  if (input.candidates.length === 0) return { matches: [], engine: "heuristic" };

  const { value, engine } = await run(
    (provider) => provider.rankExperts(input),
    () => heuristic.rankExperts(input),
  );
  return { matches: value, engine };
}

export async function answerAssistant(
  input: AssistantInput,
): Promise<{ answer: string; engine: AiEngine }> {
  const { value, engine } = await run(
    (provider) => provider.answerAssistant(input),
    () => heuristic.answerAssistant(input),
  );

  // An empty offline answer means no canned entry matched; the caller turns that
  // into its own "I don't have that" reply rather than showing a blank bubble.
  return { answer: value, engine: value.trim() ? engine : "heuristic" };
}

export type {
  AiEngine,
  AssistantInput,
  CandidateRef,
  CategoryRef,
  ProblemBrief,
  RankedMatch,
} from "./provider";
