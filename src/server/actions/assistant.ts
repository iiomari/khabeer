"use server";

import { answerAssistant } from "@/lib/ai/anthropic-provider";
import { findHelpEntry, PLATFORM_BRIEF } from "@/lib/ai/assistant-knowledge";
import { getAccountContext } from "@/server/assistant";
import { getCurrentUser } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export type AssistantReply = {
  ok: true;
  answer: string;
  href?: string;
  linkLabel?: string;
  /** Which engine produced this, so the UI can label it honestly. */
  engine: "claude" | "offline";
};

export type AssistantResult = AssistantReply | { ok: false; error: string };

const TIMEOUT_MS = 12_000;
const MAX_QUESTION = 500;

/** Per-user throttle. In-memory is enough for a demo; a real deploy would use Redis. */
const rateLimit = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

function overLimit(userId: string): boolean {
  const now = Date.now();
  const hits = (rateLimit.get(userId) ?? []).filter((at) => now - at < WINDOW_MS);
  hits.push(now);
  rateLimit.set(userId, hits);
  return hits.length > MAX_PER_WINDOW;
}

function offlineAnswer(question: string, role: string): AssistantReply {
  const entry = findHelpEntry(question, role);
  if (entry) {
    return { ok: true, answer: entry.answer, href: entry.href, linkLabel: entry.linkLabel, engine: "offline" };
  }
  return {
    ok: true,
    answer: t.assistant.noAnswer,
    href: "/#faq",
    linkLabel: t.home.faqTitle,
    engine: "offline",
  };
}

export async function askAssistantAction(input: {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<AssistantResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t.common.unauthorized };

  const question = (input.question ?? "").trim().slice(0, MAX_QUESTION);
  if (question.length < 2) return { ok: false, error: t.assistant.tooShort };

  if (overLimit(user.id)) return { ok: false, error: t.assistant.rateLimited };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return offlineAnswer(question, user.role);

  try {
    const accountContext = await getAccountContext(user);
    const answer = await Promise.race([
      answerAssistant({
        apiKey,
        question,
        platformBrief: PLATFORM_BRIEF,
        accountContext,
        history: input.history ?? [],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("assistant timeout")), TIMEOUT_MS)),
    ]);

    if (!answer) throw new Error("empty answer");

    // Attach the canned link when the question maps to a known topic, so even a
    // model answer ends somewhere actionable.
    const entry = findHelpEntry(question, user.role);
    return { ok: true, answer, href: entry?.href, linkLabel: entry?.linkLabel, engine: "claude" };
  } catch (error) {
    console.error("[assistant] falling back to the offline answers:", error);
    return offlineAnswer(question, user.role);
  }
}
