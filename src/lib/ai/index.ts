import { AnthropicAiProvider } from "./anthropic-provider";
import { HeuristicAiProvider } from "./heuristic-provider";
import type { AiEngine, AiProvider, CandidateRef, CategoryRef, ProblemBrief, RankedMatch } from "./provider";

const TIMEOUT_MS = 8_000;

const heuristic = new HeuristicAiProvider();
let anthropic: AnthropicAiProvider | null = null;

function getPrimary(): AiProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return heuristic;
  anthropic ??= new AnthropicAiProvider(key);
  return anthropic;
}

/** True when a real model is configured — used only to label the result honestly. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
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
 * Runs the configured engine, and drops to the offline engine on any failure —
 * missing key, network error, timeout, malformed JSON, invented expert ids.
 * The caller always gets a usable result and learns which engine produced it.
 */
async function run<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  engine: AiEngine,
): Promise<{ value: T; engine: AiEngine }> {
  if (engine === "heuristic") return { value: await fallback(), engine: "heuristic" };

  try {
    return { value: await withTimeout(primary()), engine: "claude" };
  } catch (error) {
    console.error("[ai] falling back to the offline engine:", error);
    return { value: await fallback(), engine: "heuristic" };
  }
}

export async function analyzeProblem(input: {
  text: string;
  categories: CategoryRef[];
  priceHints: Record<string, number>;
}): Promise<ProblemBrief> {
  const provider = getPrimary();
  const { value, engine } = await run(
    () => provider.analyzeProblem(input),
    () => heuristic.analyzeProblem(input),
    provider.name,
  );
  return { ...value, engine };
}

export async function rankExperts(input: {
  brief: Omit<ProblemBrief, "engine">;
  problemText: string;
  candidates: CandidateRef[];
}): Promise<{ matches: RankedMatch[]; engine: AiEngine }> {
  if (input.candidates.length === 0) return { matches: [], engine: "heuristic" };

  const provider = getPrimary();
  const { value, engine } = await run(
    () => provider.rankExperts(input),
    () => heuristic.rankExperts(input),
    provider.name,
  );
  return { matches: value, engine };
}

export type { AiEngine, CandidateRef, CategoryRef, ProblemBrief, RankedMatch } from "./provider";
