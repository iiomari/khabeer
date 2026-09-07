/**
 * Placeholder support channels for the demo. Nothing here is a live account —
 * the links point at the platforms' own pages so nothing 404s, and the numbers
 * are reserved-for-documentation style. Swap these for real handles at launch.
 */
export const SUPPORT_CHANNELS = [
  {
    key: "whatsapp",
    icon: "MessageCircle",
    label: "واتساب",
    value: "+966 55 000 0000",
    href: "https://wa.me/966550000000",
  },
  {
    key: "x",
    icon: "AtSign",
    label: "منصة إكس",
    value: "@khabeer_sa",
    href: "https://x.com/",
  },
  {
    key: "instagram",
    icon: "Camera",
    label: "إنستقرام",
    value: "@khabeer.sa",
    href: "https://instagram.com/",
  },
  {
    key: "email",
    icon: "Mail",
    label: "البريد",
    value: "support@khabeer.sa",
    href: "mailto:support@khabeer.sa",
  },
] as const;
