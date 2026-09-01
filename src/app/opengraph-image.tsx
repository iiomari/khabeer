import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { t } from "@/lib/i18n/ar";

export const alt = `${t.brand.name} — ${t.brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori shapes each Arabic word correctly but still orders words left-to-right,
 * so words are laid out as flex items in reverse to restore RTL reading order.
 */
function RtlText({
  text,
  style,
  gap = 14,
}: {
  text: string;
  style: React.CSSProperties;
  gap?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: gap,
        rowGap: 6,
        ...style,
      }}
    >
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`}>{word}</span>
      ))}
    </div>
  );
}

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/plex-arabic-400.ttf")),
    readFile(join(process.cwd(), "src/fonts/plex-arabic-700.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          background: "linear-gradient(140deg, #1d2b45 0%, #16233a 60%, #22334f 100%)",
          fontFamily: "Plex",
          color: "#ffffff",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            flexShrink: 0,
            borderRadius: 38,
            background: "#ffffff",
            color: "#1d2b45",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
            paddingBottom: 10,
          }}
        >
          خ
        </div>

        <RtlText
          text={t.brand.tagline}
          gap={18}
          style={{ fontSize: 64, fontWeight: 700, maxWidth: 1040, flexShrink: 0 }}
        />

        <div style={{ display: "flex", fontSize: 34, color: "#c79a63", flexShrink: 0 }}>
          {t.brand.name}
        </div>

        <RtlText
          text={t.brand.description}
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            maxWidth: 940,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plex", data: regular, weight: 400, style: "normal" },
        { name: "Plex", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
