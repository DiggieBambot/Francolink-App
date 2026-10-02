// The certificate on a web page, and the names, colours and links around it.
//
// Shared by the student's own page (/learn/<lang>/<level>/certificate) and
// the public one anyone can open from a shared link
// (francolink.net/certificates/<number>), so what a recruiter sees on
// LinkedIn is exactly what the student printed. Presentational only, no
// hooks, so it renders on the server as well.

import { SITE_URL } from "@/lib/site/hosts";

export const LANGUAGE_NAMES: Record<string, string> = {
  french: "French", fr: "French",
  spanish: "Spanish", es: "Spanish",
  english: "English", en: "English",
  german: "German", de: "German",
};

export const LEVEL_NAMES: Record<string, string> = {
  A1: "Beginner", A2: "Elementary",
  B1: "Intermediate", B2: "Upper Intermediate",
  C1: "Advanced", C2: "Mastery",
};

export const LANGUAGE_FLAGS: Record<string, string> = {
  french: "🇫🇷", fr: "🇫🇷",
  spanish: "🇪🇸", es: "🇪🇸",
  english: "🇬🇧", en: "🇬🇧",
  german: "🇩🇪", de: "🇩🇪",
};

/**
 * One look per level, from the site's level colours (lib/level-colors.ts,
 * the flashcards, the app's levelTheme): A1 blue, A2 cyan, B1 amber, B2
 * orange, C1 red, C2 purple. `accent` draws the stripe and seal; `light` is
 * the name, which needs the contrast on the dark ground.
 */
export const LEVEL_COLORS: Record<string, { from: string; to: string; accent: string; light: string; tagline: string }> = {
  A1: { from: "#1e3a6e", to: "#0f1f40", accent: "#3B82F6", light: "#93C5FD", tagline: "First steps, taken." },
  A2: { from: "#0e3a45", to: "#06222b", accent: "#06B6D4", light: "#67E8F9", tagline: "Everyday conversations, unlocked." },
  B1: { from: "#3d2e00", to: "#221900", accent: "#F59E0B", light: "#FCD34D", tagline: "Independent in the language." },
  B2: { from: "#3d1a00", to: "#220e00", accent: "#F97316", light: "#FDBA74", tagline: "Fluent with native speakers." },
  C1: { from: "#3d0000", to: "#220000", accent: "#EF4444", light: "#FCA5A5", tagline: "Advanced, at work and in study." },
  C2: { from: "#2d0a4e", to: "#17052a", accent: "#A855F7", light: "#D8B4FE", tagline: "Mastery." },
};

/** The link a student shares. Public, and opens without an account. */
export function publicCertificateUrl(certificateNumber: string): string {
  return `${SITE_URL}/certificates/${encodeURIComponent(certificateNumber)}`;
}

export type CertificateImageFormat = "certificate" | "wide" | "square" | "story";

/** The certificate as a picture, for posting. `download` makes it save. */
export function certificateImageUrl(
  certificateNumber: string,
  format: CertificateImageFormat,
  download = false,
): string {
  return `${publicCertificateUrl(certificateNumber)}/image?format=${format}${download ? "&download=1" : ""}`;
}

export interface CertificateCardProps {
  certificateNumber: string;
  /** For the image's alt text: "Marie Dupont's French A1 certificate". */
  holderName: string;
  language: string;
  level: string;
}

/**
 * The certificate, as the picture lib/certificates/image.tsx draws. One
 * design everywhere: this page, the app, print and PDF, and the images
 * students post all come from that one drawing.
 */
export function CertificateCard({ certificateNumber, holderName, language, level }: CertificateCardProps) {
  const title = `${LANGUAGE_NAMES[language] || language} ${level.toUpperCase()}`;
  return (
    // A plain <img>: the picture is already sized for print (2000×1414), and
    // next/image would only re-encode a PNG that has to stay crisp on paper.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={certificateImageUrl(certificateNumber, "certificate")}
      alt={`${holderName}'s ${title} certificate of completion from FrancoLink`}
      width={2000}
      height={1414}
      className="cert-card block w-full max-w-4xl mx-auto h-auto rounded-2xl shadow-2xl"
    />
  );
}
