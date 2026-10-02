// src/app/(student)/learn/[language]/[level]/certificate/certificate-view.tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, Share2, X,
  Twitter, Linkedin, Facebook, Link2, Check, PartyPopper
} from "lucide-react";
import { useConfetti } from "@/components/games/use-confetti";
import {
  CertificateCard,
  LANGUAGE_FLAGS as languageFlags,
  LEVEL_COLORS as levelColors,
  publicCertificateUrl,
} from "@/components/learning/certificate-card";

// ── Constants ──────────────────────────────────────────────────────────────

const levelMessages: Record<string, string> = {
  A1: "You've taken your first steps into a new language — every expert was once a beginner!",
  A2: "You can hold basic conversations and understand familiar topics. Great foundation!",
  B1: "You've crossed into independent usage — you can handle most travel situations and everyday topics.",
  B2: "Upper intermediate mastery! You can interact with native speakers with fluency and spontaneity.",
  C1: "Advanced proficiency achieved! You can express yourself fluently for academic and professional purposes.",
  C2: "Full mastery! You've reached the pinnacle of language learning. You can understand virtually everything!",
};

// ── Share Panel ────────────────────────────────────────────────────────────

function SharePanel({ userName, languageName, level, levelName, certNumber, onClose }: {
  userName: string; languageName: string; level: string;
  levelName: string; certNumber: string; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  // The public page, not this one: this one needs the student's login, so a
  // shared link to it showed everyone else a sign-in screen.
  const url = publicCertificateUrl(certNumber);
  const shareText = `🎓 I just earned my ${languageName} ${level.toUpperCase()} (${levelName}) certificate on FrancoLink! #LanguageLearning #${languageName} #CEFR`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const platforms = [
    {
      name: "Twitter / X", icon: <Twitter className="w-5 h-5" />,
      color: "bg-black hover:bg-gray-900",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "LinkedIn", icon: <Linkedin className="w-5 h-5" />,
      color: "bg-[#0077b5] hover:bg-[#006097]",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
    },
    {
      name: "Facebook", icon: <Facebook className="w-5 h-5" />,
      color: "bg-[#1877f2] hover:bg-[#1565d8]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
  ];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: `FrancoLink ${languageName} ${level.toUpperCase()} Certificate`, text: shareText, url });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PartyPopper className="w-6 h-6" />
              <h2 className="text-lg font-bold">Share Your Achievement</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-white/80 text-sm mt-1">Let the world know you've mastered {languageName} {level.toUpperCase()}!</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{shareText}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map(p => (
              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105 ${p.color}`}>
                {p.icon}{p.name}
              </a>
            ))}
          </div>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors">
              <Share2 className="w-4 h-4" />Share via Device
            </button>
          )}
          <button onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${copied ? "bg-green-50 text-green-700 border-2 border-green-300" : "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100"}`}>
            {copied ? <><Check className="w-4 h-4" />Link Copied!</> : <><Link2 className="w-4 h-4" />Copy Certificate Link</>}
          </button>
          <p className="text-center text-xs text-gray-400 font-mono">{certNumber}</p>
        </div>
      </div>
    </div>
  );
}

// ── Congrats Modal ─────────────────────────────────────────────────────────

function CongratsModal({ userName, languageName, level, levelName, accentColor, flag, onClose, onShare }: {
  userName: string; languageName: string; level: string; levelName: string;
  accentColor: string; flag: string; onClose: () => void; onShare: () => void;
}) {
  const message = levelMessages[level.toUpperCase()] || "Congratulations on your achievement!";
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: "congrats-pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>
        <div className="h-2 w-full" style={{ background: accentColor }} />
        <div className="px-8 py-8 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl"
            style={{ background: `${accentColor}22`, border: `3px solid ${accentColor}44` }}>
            🏆
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">Congratulations!</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">{userName}</h1>
          <p className="text-gray-500 mb-4">You've earned your</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-5"
            style={{ background: `${accentColor}18`, border: `2px solid ${accentColor}44` }}>
            <span className="text-3xl">{flag}</span>
            <div className="text-left">
              <p className="font-black text-xl text-gray-900">
                {languageName} <span style={{ color: accentColor }}>{level.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-500">{levelName} Certificate</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-8 max-w-sm mx-auto">{message}</p>
          <div className="flex flex-col gap-3">
            <button onClick={onShare}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: accentColor }}>
              <Share2 className="w-5 h-5" />Share Your Achievement
            </button>
            <button onClick={onClose}
              className="w-full py-3.5 rounded-xl font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
              View My Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

interface Props {
  certificate: {
    certificate_number: string; issued_at: string;
    score: number; total_xp: number; course_title: string;
  };
  userName: string; languageName: string; levelName: string;
  language: string; level: string;
  isNew?: boolean;
}

export function CertificateView({ certificate, userName, languageName, levelName, language, level, isNew = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCongrats, setShowCongrats] = useState(isNew);
  const [showShare, setShowShare] = useState(false);
  const [confettiActive, setConfettiActive] = useState(isNew);

  const colors = levelColors[level.toUpperCase()] || levelColors.A1;
  const flag = languageFlags[language] || "🌍";

  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => setConfettiActive(false), 5000);
    return () => clearTimeout(t);
  }, [isNew]);

  useConfetti(canvasRef, confettiActive);

  return (
    <>
      <style>{`
        @keyframes congrats-pop {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media print {
          .no-print { display: none !important; }
          .cert-wrapper { padding: 0 !important; background: white !important; }
          .cert-card { box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 0.5cm; size: landscape; }
        }
      `}</style>

      <canvas ref={canvasRef} className="fixed inset-0 z-30 pointer-events-none"
        style={{ display: confettiActive ? "block" : "none" }} />

      {showCongrats && (
        <CongratsModal userName={userName} languageName={languageName} level={level}
          levelName={levelName} accentColor={colors.accent} flag={flag}
          onClose={() => setShowCongrats(false)}
          onShare={() => { setShowCongrats(false); setShowShare(true); }} />
      )}

      {showShare && (
        <SharePanel userName={userName} languageName={languageName} level={level}
          levelName={levelName} certNumber={certificate.certificate_number}
          onClose={() => setShowShare(false)} />
      )}

      <div className="cert-wrapper min-h-screen bg-gray-100 py-8 px-4">
        {/* Top bar */}
        <div className="no-print max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <Link href={`/learn/${language}/${level}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />Back to Course
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">
              <Share2 className="w-4 h-4" />Share
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
              <Download className="w-4 h-4" />Download / Print
            </button>
          </div>
        </div>

        {/* Certificate */}
        <CertificateCard
          userName={userName}
          language={language}
          level={level}
          certificateNumber={certificate.certificate_number}
          courseTitle={certificate.course_title}
          score={certificate.score}
          totalXp={certificate.total_xp}
          issuedAt={certificate.issued_at}
        />

        {/* Stats */}
        <div className="no-print max-w-4xl mx-auto mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-black text-primary">{level.toUpperCase()}</p>
            <p className="text-sm text-gray-500">CEFR Level</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-black text-primary">{certificate.score}%</p>
            <p className="text-sm text-gray-500">Avg. Score</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-black text-primary">{certificate.total_xp.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total XP</p>
          </div>
        </div>

        <div className="no-print max-w-4xl mx-auto mt-6 text-center">
          <button onClick={() => setShowShare(true)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" />Share your certificate on social media
          </button>
        </div>
      </div>
    </>
  );
}