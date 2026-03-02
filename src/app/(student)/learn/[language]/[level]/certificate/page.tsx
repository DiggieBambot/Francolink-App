// src/app/(student)/learn/[language]/[level]/certificate/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CertificateView } from "./certificate-view";

interface PageProps {
  params: Promise<{ language: string; level: string }>;
  searchParams: Promise<{ new?: string }>;
}

const languageNames: Record<string, string> = {
  french: "French", fr: "French",
  spanish: "Spanish", es: "Spanish",
  english: "English", en: "English",
  german: "German", de: "German",
};

const levelNames: Record<string, string> = {
  A1: "Beginner", A2: "Elementary",
  B1: "Intermediate", B2: "Upper Intermediate",
  C1: "Advanced", C2: "Mastery",
};

export default async function CertificatePage({ params, searchParams }: PageProps) {
  const { language, level } = await params;
  const { new: isNewParam } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: certificate } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .eq("level", level.toUpperCase())
    .single();

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Yet Earned</h1>
          <p className="text-gray-600 mb-6">
            Complete all lessons in the {languageNames[language]} {level.toUpperCase()} course to earn your certificate.
          </p>
          <Link href={`/learn/${language}/${level}`}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90">
            Continue Learning →
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.name || profile?.email?.split("@")[0] || "Student";
  const langName = languageNames[language] || language;
  const levelName = levelNames[level.toUpperCase()] || level.toUpperCase();

  return (
    <CertificateView
      certificate={certificate}
      userName={userName}
      languageName={langName}
      levelName={levelName}
      language={language}
      level={level}
      isNew={isNewParam === "1"}
    />
  );
}