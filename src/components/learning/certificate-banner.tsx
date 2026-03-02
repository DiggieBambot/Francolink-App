// src/components/learning/certificate-banner.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, Loader2, CheckCircle } from "lucide-react";

interface Props {
  language: string;
  level: string;
  progressPercent: number;
}

export function CertificateBanner({ language, level, progressPercent }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "issuing" | "issued" | "exists" | "error">("idle");
  const [certNumber, setCertNumber] = useState<string | null>(null);

  useEffect(() => {
    if (progressPercent < 100) return;

    const issueCert = async () => {
      setStatus("issuing");
      try {
        const res = await fetch("/api/certificates/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, level }),
        });
        const data = await res.json();
        if (data.certificate) {
          setCertNumber(data.certificate.certificate_number);
          setStatus(data.alreadyIssued ? "exists" : "issued");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    issueCert();
  }, [progressPercent, language, level]);

  const handleViewCert = () => {
    const isNew = status === "issued" ? "?new=1" : "";
    router.push(`/learn/${language}/${level.toLowerCase()}/certificate${isNew}`);
  };

  if (progressPercent < 100) return null;

  const levelNames: Record<string, string> = {
    a1: "Beginner", a2: "Elementary",
    b1: "Intermediate", b2: "Upper Intermediate",
    c1: "Advanced", c2: "Mastery",
  };
  const levelName = levelNames[level.toLowerCase()] || level.toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl mb-6"
      style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)" }}>
      <div className="h-1 w-full" style={{ background: "#f59e0b" }} />
      <div className="px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(245,158,11,0.15)", border: "2px solid rgba(245,158,11,0.4)" }}>
          {status === "issuing"
            ? <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            : <Award className="w-7 h-7 text-amber-400" />}
        </div>

        <div className="flex-1">
          {status === "issuing" && (
            <>
              <p className="text-white font-bold text-lg">Issuing Your Certificate...</p>
              <p className="text-white/60 text-sm">Generating your {level.toUpperCase()} certificate</p>
            </>
          )}
          {status === "issued" && (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-300 text-xs font-semibold uppercase tracking-wide">Certificate Issued!</p>
              </div>
              <p className="text-white font-bold text-lg">{level.toUpperCase()} {levelName} — Complete! 🎉</p>
              {certNumber && <p className="text-white/50 text-xs font-mono mt-0.5">{certNumber}</p>}
            </>
          )}
          {status === "exists" && (
            <>
              <p className="text-amber-300 font-bold text-lg">🎓 {level.toUpperCase()} {levelName} Certificate</p>
              <p className="text-white/60 text-sm">You've already earned this certificate</p>
              {certNumber && <p className="text-white/40 text-xs font-mono mt-0.5">{certNumber}</p>}
            </>
          )}
          {(status === "error" || status === "idle") && (
            <>
              <p className="text-white font-bold text-lg">Level Complete! 🎉</p>
              <p className="text-white/60 text-sm">All lessons finished</p>
            </>
          )}
        </div>

        {(status === "issued" || status === "exists") && (
          <button onClick={handleViewCert}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "#f59e0b", color: "#1e3a5f" }}>
            <Award className="w-4 h-4" />View Certificate
          </button>
        )}
      </div>
    </div>
  );
}