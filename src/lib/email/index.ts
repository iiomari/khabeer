import { ConsoleEmailProvider } from "./console-provider";
import { ResendEmailProvider } from "./resend-provider";
import type { EmailMessage, EmailProvider } from "./provider";

let provider: EmailProvider | null = null;

/** Live sending switches on the moment RESEND_API_KEY is present; nothing else changes. */
function getProvider(): EmailProvider {
  if (provider) return provider;
  const key = process.env.RESEND_API_KEY;
  provider = key
    ? new ResendEmailProvider(key, process.env.EMAIL_FROM ?? "خبير <onboarding@resend.dev>")
    : new ConsoleEmailProvider();
  return provider;
}

/**
 * Email is a courtesy channel on top of the in-app notification, never the only
 * one — so a failure is logged and swallowed rather than failing the action that
 * triggered it. A booking must not fail because a mail server did.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    const result = await getProvider().send(message);
    if (!result.ok) console.error("[email] send failed:", result.error);
    return result.ok;
  } catch (error) {
    console.error("[email] send threw:", error);
    return false;
  }
}

export type { EmailMessage, EmailProvider } from "./provider";
