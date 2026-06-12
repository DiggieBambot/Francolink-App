import Link from "next/link";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const LANG_NAMES: Record<string, { name: string; flag: string; slug: string }> = {
  fr: { name: "French", flag: "\u{1F1EB}\u{1F1F7}", slug: "french" },
  en: { name: "English", flag: "\u{1F1EC}\u{1F1E7}", slug: "english" },
  es: { name: "Spanish", flag: "\u{1F1EA}\u{1F1F8}", slug: "spanish" },
  de: { name: "German", flag: "\u{1F1E9}\u{1F1EA}", slug: "german" },
};

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const supabase = await createClient();

  // Count published courses per language
  const { data: courses } = await supabase
    .from("courses")
    .select("id, language_id, languages(code)")
    .eq("is_published", true);

  const countByCode: Record<string, number> = {};
  for (const c of courses || []) {
    const code = (c.languages as any)?.code;
    if (code) countByCode[code] = (countByCode[code] || 0) + 1;
  }

  // Build list: only show languages with at least 1 published course
  const languages = Object.entries(LANG_NAMES)
    .filter(([code]) => (countByCode[code] || 0) > 0)
    .map(([code, meta]) => ({
      ...meta,
      courses: countByCode[code] || 0,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          Learn a Language
        </h1>
        <p className="text-gray-600 mt-1">
          Choose a language to start or continue learning
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languages.map((lang) => (
          <Link key={lang.slug} href={`/learn/${lang.slug}`}>
            <Card hover className="text-center">
              <span className="text-6xl mb-4 block">{lang.flag}</span>
              <h2 className="text-xl font-heading font-bold text-primary mb-2">
                {lang.name}
              </h2>
              <p className="text-gray-500">
                {lang.courses} {lang.courses === 1 ? "course" : "courses"} available
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
