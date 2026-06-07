// Font descriptor accepted by next/og's ImageResponse (not exported by name).
export type FontOptions = {
  name: string;
  data: ArrayBuffer | Buffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: "normal" | "italic";
};

export const COLORS = {
  ink: "#1C1B1A",
  parchment: "#F5F1EB",
  copper: "#B87333",
  oxblood: "#722F37",
};

export type Theme = "minimal" | "organic" | "bold";
export type AspectRatio = "square" | "story";

export const SIZES: Record<AspectRatio, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

type LoadedFonts = {
  fonts: FontOptions[];
  display?: string; // family name to use, when loaded
};

// Google serves TTF (which Satori needs) when the User-Agent does not advertise
// woff2 support. Best-effort: any failure falls back to next/og's default font.
async function fetchGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const name = family.replace(/ /g, "+");
    const url = `https://fonts.googleapis.com/css2?family=${name}:wght@${weight}&text=${encodeURIComponent(
      text
    )}`;
    const cssRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 5.1)" },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const src = css.match(/src:\s*url\((.+?)\)\s*format/);
    if (!src) return null;
    const fontRes = await fetch(src[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function loadFonts(text: string): Promise<LoadedFonts> {
  const fraunces = await fetchGoogleFont("Fraunces", 600, text);
  const inter = await fetchGoogleFont("Inter", 500, `${text} MATHETES·`);

  const fonts: FontOptions[] = [];
  if (fraunces)
    fonts.push({ name: "Fraunces", data: fraunces, weight: 600, style: "normal" });
  if (inter)
    fonts.push({ name: "Inter", data: inter, weight: 500, style: "normal" });

  return { fonts, display: fraunces ? "Fraunces" : undefined };
}

/** Scale verse type down as the text gets longer. */
function fitFontSize(len: number, ratio: AspectRatio): number {
  const scale = ratio === "story" ? 1.08 : 1;
  const base =
    len > 260 ? 40 : len > 180 ? 48 : len > 110 ? 58 : len > 60 ? 68 : 78;
  return Math.round(base * scale);
}

function ff(name?: string) {
  return name ? { fontFamily: name } : {};
}

function Wordmark({ display, color }: { display?: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 30,
        letterSpacing: 1,
        color,
        ...ff(display),
      }}
    >
      Mathetes
    </div>
  );
}

export function VerseImage({
  verseText,
  verseRef,
  theme,
  ratio,
  watermark,
  display,
}: {
  verseText: string;
  verseRef: string;
  theme: Theme;
  ratio: AspectRatio;
  watermark: boolean;
  display?: string;
}) {
  const size = SIZES[ratio];
  const fontSize = fitFontSize(verseText.length, ratio);
  const refEl = (color: string, underline = false) => (
    <div
      style={{
        display: "flex",
        marginTop: 36,
        fontSize: 28,
        letterSpacing: 6,
        textTransform: "uppercase",
        color,
        ...(underline
          ? { borderBottom: `3px solid ${COLORS.copper}`, paddingBottom: 10 }
          : {}),
      }}
    >
      {verseRef}
    </div>
  );

  if (theme === "bold") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: size.width,
          height: size.height,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 6,
            backgroundColor: COLORS.oxblood,
            padding: 96,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize,
              lineHeight: 1.3,
              color: COLORS.parchment,
              ...ff(display),
            }}
          >
            {verseText}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 4,
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: COLORS.parchment,
            padding: 96,
          }}
        >
          {refEl(COLORS.oxblood)}
          {watermark && (
            <div style={{ display: "flex", marginTop: 40 }}>
              <Wordmark display={display} color={COLORS.copper} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // minimal + organic share a parchment canvas; organic adds a soft overlay
  // and a copper underline beneath the reference.
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: size.width,
        height: size.height,
        backgroundColor: COLORS.parchment,
        padding: 110,
        position: "relative",
      }}
    >
      {theme === "organic" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(184,115,51,0.10), rgba(245,241,235,0) 60%)",
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          fontSize,
          lineHeight: 1.32,
          color: COLORS.ink,
          ...ff(display),
        }}
      >
        {verseText}
      </div>
      {refEl(COLORS.copper, theme === "organic")}
      {watermark && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 64,
            left: 110,
          }}
        >
          <Wordmark display={display} color={`${COLORS.ink}99`} />
        </div>
      )}
    </div>
  );
}
