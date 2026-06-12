import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const LEVEL_META: Record<string, { color: string; icon: string; fallbackDesc: string }> = {
  A1: { color: "bg-green-100 text-green-700", icon: "🌱", fallbackDesc: "Start here! Learn greetings, basic phrases, and survival skills." },
  A2: { color: "bg-blue-100 text-blue-700", icon: "🚀", fallbackDesc: "Talk about your past, future plans, and daily routine." },
  B1: { color: "bg-orange-100 text-orange-700", icon: "🔥", fallbackDesc: "Express opinions, feelings, and deal with most situations." },
  B2: { color: "bg-purple-100 text-purple-700", icon: "🎓", fallbackDesc: "Achieve fluency. Understand complex texts and argue effectively." },
};

const LANG_FLAGS: Record<string, string> = {
  french: "🇫🇷", fr: "🇫🇷",
  english: "🇬🇧", en: "🇬🇧",
  spanish: "🇪🇸", es: "🇪🇸",
  german: "🇩🇪", de: "🇩🇪",
};

interface PageProps {
  params: Promise<{ language: string }>;
}

export default async function LevelSelectPage({ params }: PageProps) {
  const { language } = await params;
  const langName = language.charAt(0).toUpperCase() + language.slice(1);
  const flag = LANG_FLAGS[language.toLowerCase()] || "🌍";

  const supabase = await createClient();

  // Fetch courses for this language by slug prefix
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, level, description, total_lessons, is_published")
    .like("slug", `${language}-%`)
    .eq("is_published", true)
    .order("level");

  const levels = (courses || []).map((c) => {
    const meta = LEVEL_META[c.level] || LEVEL_META.A1;
    return {
      id: c.level.toLowerCase(),
      title: `${c.level} - ${c.title.replace(/^.*?—\s*/, "").replace(/^.*?-\s*/, "")}`,
      description: c.description || meta.fallbackDesc,
      color: meta.color,
      icon: meta.icon,
      lessons: c.total_lessons || 0,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">{flag}</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose Your Level
        </h1>
        <p className="text-xl text-gray-600">
          Learning <span className="font-semibold text-primary">{langName}</span>
        </p>
      </div>

      {levels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses available for {langName} yet.</p>
          <Link href="/learn" className="mt-4 inline-block text-primary hover:underline">
            ← Back to Languages
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {levels.map((level) => (
            <Link
              key={level.id}
              href={`/learn/${language}/${level.id}`}
              className="group relative bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${level.color}`}
                >
                  {level.icon}
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-medium text-gray-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {level.lessons} Lessons
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {level.title}
              </h3>
              <p className="text-gray-600 mb-6 line-clamp-2">
                {level.description}
              </p>

              <div className="flex items-center text-primary font-medium text-sm">
                Start Level
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
