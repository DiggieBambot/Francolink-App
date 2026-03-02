// src/components/learning/my-certificates.tsx
// Drop this into your profile page or dashboard sidebar.
// Usage: <MyCertificates userId={user.id} />
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Certificate {
  id: string;
  language: string;
  level: string;
  course_title: string;
  certificate_number: string;
  issued_at: string;
  score: number;
}

const languageFlags: Record<string, string> = {
  french: "🇫🇷", spanish: "🇪🇸", english: "🇬🇧", german: "🇩🇪",
};

const levelColors: Record<string, string> = {
  A1: "bg-blue-50 border-blue-200 text-blue-800",
  A2: "bg-sky-50 border-sky-200 text-sky-800",
  B1: "bg-green-50 border-green-200 text-green-800",
  B2: "bg-purple-50 border-purple-200 text-purple-800",
  C1: "bg-red-50 border-red-200 text-red-800",
  C2: "bg-amber-50 border-amber-200 text-amber-800",
};

const levelNames: Record<string, string> = {
  A1: "Beginner", A2: "Elementary",
  B1: "Intermediate", B2: "Upper Intermediate",
  C1: "Advanced", C2: "Mastery",
};

interface Props {
  userId: string;
}

export function MyCertificates({ userId }: Props) {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });
      setCerts(data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (certs.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Award className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No certificates yet.</p>
        <p className="text-gray-400 text-xs mt-1">
          Complete all lessons in a level to earn one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {certs.map((cert) => {
        const flag = languageFlags[cert.language] || "🌍";
        const colorClass = levelColors[cert.level] || levelColors.A1;
        const levelName = levelNames[cert.level] || cert.level;
        const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric",
        });

        return (
          <div
            key={cert.id}
            className={`flex items-center gap-4 p-4 rounded-xl border ${colorClass} transition-all`}
          >
            {/* Flag + level badge */}
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl">{flag}</div>
              <div className={`text-xs font-black mt-0.5`}>{cert.level}</div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">
                {cert.course_title}
              </p>
              <p className="text-xs opacity-70 mt-0.5">{levelName}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs opacity-60">{issuedDate}</span>
                <span className="text-xs font-medium">{cert.score}% avg</span>
              </div>
            </div>

            {/* View link */}
            <Link
              href={`/learn/${cert.language}/${cert.level.toLowerCase()}/certificate`}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-white/60 transition-colors"
              title="View Certificate"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}