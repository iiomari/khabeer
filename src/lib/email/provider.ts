export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body. Arabic, since every recipient of this platform reads Arabic. */
  text: string;
  /** Optional call-to-action rendered as a button in the HTML version. */
  action?: { label: string; url: string };
};

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }>;
}
