import type { EmailMessage, EmailProvider } from "./provider";

/**
 * Development provider: prints the message instead of sending it. Nothing leaves
 * the server, so the notification flow can be exercised end to end without an
 * email account — and without mailing real people from a demo database.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage) {
    console.info(
      [
        "",
        "──────── بريد (لم يُرسل فعليًا) ────────",
        `إلى:    ${message.to}`,
        `الموضوع: ${message.subject}`,
        "",
        message.text,
        message.action ? `\n${message.action.label}: ${message.action.url}` : "",
        "────────────────────────────────────────",
      ].join("\n"),
    );
    return { ok: true, id: `console-${Date.now().toString(36)}` };
  }
}
