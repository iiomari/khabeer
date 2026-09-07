import type { EmailMessage, EmailProvider } from "./provider";

/** Live provider. Uses Resend's REST API directly so no SDK dependency is needed. */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async send(message: EmailMessage) {
    const button = message.action
      ? `<p style="margin:24px 0"><a href="${message.action.url}" style="background:#22355C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">${message.action.label}</a></p>`
      : "";

    const html = `<div dir="rtl" style="font-family:system-ui,'Segoe UI',Tahoma,sans-serif;line-height:1.8;color:#17233D;max-width:560px">
      <p style="white-space:pre-line">${message.text}</p>${button}
      <hr style="border:0;border-top:1px solid #E6E0D5;margin:28px 0">
      <p style="font-size:12px;color:#5D6A85">خبير — خبرتك ما توقف عند التقاعد</p>
    </div>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html,
        }),
      });

      if (!response.ok) {
        return { ok: false, error: `resend ${response.status}: ${await response.text()}` };
      }
      const data = (await response.json()) as { id?: string };
      return { ok: true, id: data.id };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }
}
