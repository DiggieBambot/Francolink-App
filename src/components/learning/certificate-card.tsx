// The certificate itself, as drawn on paper.
//
// Shared by the student's own page (/learn/<lang>/<level>/certificate) and
// the public one anyone can open from a shared link
// (francolink.net/certificates/<number>), so what a recruiter sees on
// LinkedIn is exactly what the student printed. Presentational only, no
// hooks, so it renders on the server as well.

import { Award } from "lucide-react";
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

export const LEVEL_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  A1: { from: "#1e3a5f", to: "#0f2040", accent: "#f59e0b" },
  A2: { from: "#1e3a5f", to: "#0f2040", accent: "#3b82f6" },
  B1: { from: "#1a3a2a", to: "#0f2018", accent: "#10b981" },
  B2: { from: "#2d1b4e", to: "#1a0f30", accent: "#8b5cf6" },
  C1: { from: "#4a1515", to: "#2d0d0d", accent: "#ef4444" },
  C2: { from: "#1a1a1a", to: "#0a0a0a", accent: "#f59e0b" },
};

/** The link a student shares. Public, and opens without an account. */
export function publicCertificateUrl(certificateNumber: string): string {
  return `${SITE_URL}/certificates/${encodeURIComponent(certificateNumber)}`;
}

export interface CertificateCardProps {
  userName: string;
  /** As stored on the certificate: "french", "spanish", … */
  language: string;
  level: string;
  certificateNumber: string;
  courseTitle: string;
  score: number;
  totalXp: number;
  issuedAt: string;
}

export function CertificateCard({
  userName,
  language,
  level,
  certificateNumber,
  courseTitle,
  score,
  totalXp,
  issuedAt,
}: CertificateCardProps) {
  const lvl = level.toUpperCase();
  const colors = LEVEL_COLORS[lvl] || LEVEL_COLORS.A1;
  const flag = LANGUAGE_FLAGS[language] || "🌍";
  const languageName = LANGUAGE_NAMES[language] || language;
  const levelName = LEVEL_NAMES[lvl] || lvl;
  const issuedDate = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  return (
    <div className="cert-card max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
      style={{ aspectRatio: "1.414/1" }}>
      <div className="relative w-full h-full flex"
        style={{ background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)` }}>
        <div className="w-3 flex-shrink-0 h-full" style={{ background: colors.accent }} />
        <div className="flex-1 flex flex-col px-5 py-4 sm:px-12 sm:py-10 relative">
          <div className="flex items-start justify-between mb-2 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-xl"
                style={{ background: colors.accent, color: colors.from }}>FL</div>
              <div>
                <p className="text-white font-bold text-sm sm:text-lg leading-none">FrancoLink</p>
                <p className="text-white/50 text-[10px] sm:text-xs">Language Learning Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] sm:text-xs mb-0.5">Certificate No.</p>
              <p className="text-white/80 text-[10px] sm:text-xs font-mono font-bold">{certificateNumber}</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-1 sm:mb-3">Certificate of Completion</p>
            <p className="text-white/70 text-xs sm:text-base mb-1 sm:mb-2">This certifies that</p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-4 leading-tight" style={{ color: colors.accent }}>{userName}</h1>
            <p className="text-white/70 text-xs sm:text-base mb-1 sm:mb-4">has successfully completed the</p>
            <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-4">
              <span className="text-2xl sm:text-4xl">{flag}</span>
              <div>
                <h2 className="text-white font-black text-lg sm:text-2xl md:text-3xl leading-tight">{languageName} {lvl}</h2>
                <p className="text-white/60 text-[11px] sm:text-sm">{levelName} — {courseTitle}</p>
              </div>
            </div>
            <p className="hidden sm:block text-white/50 text-sm">demonstrating {levelName.toLowerCase()} proficiency in {languageName}.</p>
          </div>
          <div className="flex items-end justify-between mt-2 sm:mt-6">
            <div className="flex gap-4 sm:gap-6">
              <div>
                <p className="text-white/40 text-[10px] sm:text-xs mb-0.5">Average Score</p>
                <p className="font-bold text-sm sm:text-xl" style={{ color: colors.accent }}>{score}%</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] sm:text-xs mb-0.5">XP Earned</p>
                <p className="text-white font-bold text-sm sm:text-xl">{totalXp.toLocaleString("en-US")}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] sm:text-xs mb-0.5">Issued</p>
                <p className="text-white/80 text-[11px] sm:text-sm font-medium">{issuedDate}</p>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center border-2 sm:border-4"
              style={{ borderColor: colors.accent, background: "rgba(255,255,255,0.05)" }}>
              <Award className="w-4 h-4 sm:w-7 sm:h-7 mb-0.5" style={{ color: colors.accent }} />
              <p className="text-[10px] sm:text-xs font-black" style={{ color: colors.accent }}>{lvl}</p>
              <p className="hidden sm:block text-white/50 text-xs leading-none">CERT</p>
            </div>
          </div>
        </div>
        <div className="w-1.5 flex-shrink-0 h-full opacity-40" style={{ background: colors.accent }} />
      </div>
    </div>
  );
}
