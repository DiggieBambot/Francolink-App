// Draws a certificate as a PNG. The one place the certificate's design lives:
// the website shows this picture, the app shows it, print and PDF print it,
// and the social images frame it. Change it here and it changes everywhere.
//
// The design: a black certificate with angled dark panels, metallic diagonal
// ribbons in two corners, a thin metal frame, CERTIFICATE / OF COMPLETION in
// a classical serif, the name in script, a medal between two signature lines.
// The metal is the level's colour -- B1 is the classic gold; A1 blue, A2
// cyan, B2 bronze, C1 red, C2 purple -- so a learner's certificates read as
// a set, and each level looks like an achievement of its own.
//
// Formats (all PNG):
//   certificate  2000×1414   the document itself (A4 landscape ratio)
//   wide         1200×630    link previews on LinkedIn, X, Facebook, WhatsApp
//   square       1080×1080   Instagram / Facebook posts
//   story        1080×1920   Stories and WhatsApp Status
//
// Fonts are files in assets/certificate-fonts (all SIL Open Font License),
// read from disk: a certificate must never fail because a font CDN did.

import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";
import { LANGUAGE_NAMES, LEVEL_NAMES } from "@/components/learning/certificate-card";
import type { VerifiedCertificate } from "@/lib/certificates/verify";

export type CertificateFormat = "certificate" | "wide" | "square" | "story";

export const SIZES: Record<CertificateFormat, { width: number; height: number }> = {
  certificate: { width: 2000, height: 1414 },
  wide: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

/** Each level's metal: highlight, body and shadow of the same colour. */
interface Metal {
  light: string;
  mid: string;
  dark: string;
  /** The name and headings: the brightest legible tone on black. */
  ink: string;
}

const METALS: Record<string, Metal> = {
  A1: { light: "#DBEAFE", mid: "#3B82F6", dark: "#1E3A8A", ink: "#60A5FA" },
  A2: { light: "#CFFAFE", mid: "#06B6D4", dark: "#155E75", ink: "#22D3EE" },
  B1: { light: "#FDF1B8", mid: "#D4A62A", dark: "#7A5A0E", ink: "#E2B640" },
  B2: { light: "#FFE4CC", mid: "#E8772E", dark: "#8A3A0E", ink: "#F59E5B" },
  C1: { light: "#FEE2E2", mid: "#E0454B", dark: "#7F1D1D", ink: "#F87171" },
  C2: { light: "#F3E8FF", mid: "#A855F7", dark: "#581C87", ink: "#C084FC" },
};

const metalFor = (level: string) => METALS[level.toUpperCase()] ?? METALS.B1;

/** Brushed metal along a ribbon: shadow, shine, body, shine, shadow. */
const brushed = (m: Metal) =>
  `linear-gradient(90deg, ${m.dark} 0%, ${m.light} 22%, ${m.mid} 50%, ${m.light} 78%, ${m.dark} 100%)`;

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
type Font = { name: string; data: Buffer; weight: 400 | 500 | 700; style: "normal" };
let fontsPromise: Promise<Font[]> | null = null;

function fonts(): Promise<Font[]> {
  const dir = join(process.cwd(), "assets", "certificate-fonts");
  const load = async (file: string, name: string, weight: Font["weight"]): Promise<Font> => ({
    name,
    data: await readFile(join(dir, file)),
    weight,
    style: "normal",
  });
  fontsPromise ??= Promise.all([
    load("Cinzel-Bold.ttf", "Cinzel", 700),
    load("GreatVibes-Regular.ttf", "Great Vibes", 400),
    load("Montserrat-Medium.ttf", "Montserrat", 500),
    load("Montserrat-Bold.ttf", "Montserrat", 700),
  ]).catch((err) => {
    fontsPromise = null; // don't remember a failure; try again next time
    throw err;
  });
  return fontsPromise;
}

// ---------------------------------------------------------------------------
// The certificate, drawn at any width (laid out on a 1600-wide grid)
// ---------------------------------------------------------------------------
interface Words {
  name: string;
  courseLine: string;
  level: string;
  issued: string;
  number: string;
}

function words(c: VerifiedCertificate): Words {
  const level = c.level.toUpperCase();
  const language = LANGUAGE_NAMES[c.language] ?? c.language;
  return {
    name: c.holder_name,
    courseLine:
      `For successfully completing every lesson of the FrancoLink ${language} ${level} ` +
      `(${LEVEL_NAMES[level] ?? level}) course` +
      (c.score ? `, with an average score of ${c.score}%.` : "."),
    level,
    issued: new Date(c.issued_at)
      .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
      .toUpperCase(),
    number: c.certificate_number,
  };
}

function CertificateArt({ w, m, t }: { w: number; m: Metal; t: Words }) {
  const h = Math.round(w / 1.4142);
  const u = w / 1600;
  const p = (n: number) => Math.round(n * u);

  /** A rotated block, positioned by its centre (rotation is about the centre). */
  const block = (cx: number, cy: number, bw: number, bh: number, deg: number, background: string) => (
    <div
      style={{
        position: "absolute",
        left: p(cx - bw / 2),
        top: p(cy - bh / 2),
        width: p(bw),
        height: p(bh),
        transform: `rotate(${deg}deg)`,
        backgroundImage: background,
      }}
    />
  );

  const panel = (a: string, b: string) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
  const nameSize = t.name.length > 26 ? 92 : t.name.length > 18 ? 112 : 132;

  const signature = (top: string, bottom: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: p(330) }}>
      <div style={{ display: "flex", flexShrink: 0, width: p(300), height: Math.max(2, p(3)), background: m.mid, marginBottom: p(16) }} />
      <div style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: p(26), letterSpacing: p(2), color: m.ink }}>
        {top}
      </div>
      <div style={{ fontFamily: "Montserrat", fontWeight: 500, fontSize: p(20), color: "rgba(255,255,255,0.8)", marginTop: p(4) }}>
        {bottom}
      </div>
    </div>
  );

  return (
    <div style={{ width: w, height: h, position: "relative", display: "flex", overflow: "hidden", background: "#0b0b0d" }}>
      {/* Angled dark panels, back to front */}
      {block(120, 60, 640, 640, 45, panel("#1d1d21", "#101012"))}
      {block(470, -90, 420, 420, 45, panel("#19191c", "#0f0f11"))}
      {block(-40, 560, 360, 360, 45, panel("#161619", "#0d0d0f"))}
      {block(1480, 1070, 640, 640, 45, panel("#101012", "#1d1d21"))}
      {block(1130, 1220, 420, 420, 45, panel("#0f0f11", "#19191c"))}
      {block(1640, 570, 360, 360, 45, panel("#0d0d0f", "#161619"))}

      {/* Metal ribbons across two corners */}
      {block(1500, 70, 1000, 54, 45, brushed(m))}
      {block(1580, 150, 1000, 10, 45, brushed(m))}
      {block(100, 1061, 1000, 54, 45, brushed(m))}
      {block(20, 981, 1000, 10, 45, brushed(m))}

      {/* Thin metal frame */}
      <div
        style={{
          position: "absolute",
          left: p(70),
          top: p(70),
          width: p(1600 - 140),
          height: h - p(140),
          border: `${Math.max(2, p(3))}px solid ${m.mid}`,
          display: "flex",
        }}
      />

      {/* Words */}
      <div
        style={{
          position: "absolute",
          left: p(70),
          top: p(70),
          width: p(1600 - 140),
          height: h - p(140),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: p(70),
        }}
      >
        <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: p(150), lineHeight: 1, letterSpacing: p(6), color: m.ink }}>
          CERTIFICATE
        </div>
        <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: p(50), letterSpacing: p(10), color: m.ink, marginTop: p(6) }}>
          OF COMPLETION
        </div>
        <div style={{ fontFamily: "Montserrat", fontWeight: 500, fontSize: p(24), letterSpacing: p(5), color: "#ffffff", marginTop: p(34) }}>
          THIS CERTIFICATE IS PROUDLY PRESENTED TO
        </div>
        <div style={{ fontFamily: "Great Vibes", fontSize: p(nameSize), lineHeight: 1.15, color: m.ink, marginTop: p(14) }}>
          {t.name}
        </div>
        <div style={{ display: "flex", flexShrink: 0, width: p(760), height: Math.max(2, p(2)), background: m.mid, marginTop: p(4) }} />
        <div
          style={{
            fontFamily: "Montserrat",
            fontWeight: 500,
            fontSize: p(22),
            lineHeight: 1.45,
            letterSpacing: p(1),
            color: "rgba(255,255,255,0.88)",
            textAlign: "center",
            textTransform: "uppercase",
            width: p(1060),
            marginTop: p(26),
            justifyContent: "center",
          }}
        >
          {t.courseLine}
        </div>

        {/* Signatures and medal */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: p(70), marginTop: p(40) }}>
          {signature("FRANCOLINK", "Issued by")}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: p(190), height: p(230) }}>
            {/* tails, behind the medal */}
            <div style={{ position: "absolute", left: p(48), top: p(120), width: p(46), height: p(100), background: "#141416", borderBottom: `${p(4)}px solid ${m.dark}`, transform: "rotate(18deg)", display: "flex" }} />
            <div style={{ position: "absolute", left: p(96), top: p(120), width: p(46), height: p(100), background: "#141416", borderBottom: `${p(4)}px solid ${m.dark}`, transform: "rotate(-18deg)", display: "flex" }} />
            <div
              style={{
                position: "absolute",
                left: p(15),
                top: 0,
                width: p(160),
                height: p(160),
                borderRadius: 999,
                backgroundImage: `linear-gradient(135deg, ${m.light} 0%, ${m.mid} 45%, ${m.dark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: p(126),
                  height: p(126),
                  borderRadius: 999,
                  background: "#111113",
                  border: `${p(3)}px solid ${m.dark}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontFamily: "Cinzel", fontWeight: 700, fontSize: p(46), lineHeight: 1, color: m.ink }}>{t.level}</div>
                <div style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: p(11), letterSpacing: p(2), color: "rgba(255,255,255,0.7)", marginTop: p(4) }}>
                  CERTIFIED
                </div>
              </div>
            </div>
          </div>
          {signature(t.issued, "Date of issue")}
        </div>
      </div>

      {/* Number, for verification */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: p(84),
          width: w,
          display: "flex",
          justifyContent: "center",
          fontFamily: "Montserrat",
          fontWeight: 500,
          fontSize: p(15),
          letterSpacing: p(2),
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {`No. ${t.number}  ·  francolink.net/certificates/${t.number}`}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The formats
// ---------------------------------------------------------------------------
export async function certificateImage(
  c: VerifiedCertificate,
  format: CertificateFormat
): Promise<ImageResponse> {
  const m = metalFor(c.level);
  const t = words(c);
  const { width, height } = SIZES[format];
  const language = LANGUAGE_NAMES[c.language] ?? c.language;

  // Social formats: the certificate on a softly lit ground, with one line
  // saying what it is. The ground is the level's metal, darkened.
  const ground = `radial-gradient(circle at 50% 40%, ${m.dark} 0%, #0b0b0d 75%)`;
  const headline = (size: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Montserrat", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>
      <div style={{ fontSize: size * 0.55, letterSpacing: 6, color: m.ink }}>CERTIFIED</div>
      <div style={{ fontSize: size, lineHeight: 1.1, marginTop: 10 }}>{`I completed ${language} ${t.level}`}</div>
    </div>
  );
  const footer = (size: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Montserrat", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ fontWeight: 700, fontSize: size, color: "#ffffff" }}>Learn with FrancoLink</div>
      <div style={{ fontWeight: 500, fontSize: size * 0.7, marginTop: 6 }}>francolink.net</div>
    </div>
  );
  const framed = (artWidth: number) => (
    <div style={{ display: "flex", boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px ${m.dark}` }}>
      <CertificateArt w={artWidth} m={m} t={t} />
    </div>
  );

  const content =
    format === "certificate" ? (
      <CertificateArt w={width} m={m} t={t} />
    ) : format === "wide" ? (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: ground }}>
        {framed(820)}
      </div>
    ) : format === "square" ? (
      <div style={{ width, height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "70px 0 60px", backgroundImage: ground }}>
        {headline(54)}
        {framed(960)}
        {footer(30)}
      </div>
    ) : (
      <div style={{ width, height, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "230px 0 200px", backgroundImage: ground }}>
        {headline(76)}
        {framed(1000)}
        {footer(40)}
      </div>
    );

  return new ImageResponse(content, { width, height, fonts: await fonts() });
}
