// src/app/(student)/learn/[language]/games/page.tsx
//
// Theme picker. Server-rendered: fetches the themes API directly via the
// classifier so we don't go round-trip on first paint.

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { langCode } from "@/lib/utils/language";
import { THEMES, classifyVocab } from "@/lib/games/themes";

interface Props {
  params: Promise<{ language: string }>;
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIN_ITEMS = 6;

async function getThemeCounts(langSlug: string) {
  const code = langCode(langSlug);
  const { data: courses } = await admin.from("courses").select("id, language:languages(code)").eq("is_published", true);
  const courseIds = (courses || []).filter((c: any) => c.language?.code === code).map((c: any) => c.id);
  if (courseIds.length === 0) return [];
  const { data: units } = await admin.from("units").select("id").in("course_id", courseIds);
  const unitIds = (units || []).map((u: any) => u.id);
  if (unitIds.length === 0) return [];
  const { data: lessons } = await admin.from("lessons").select("content").in("unit_id", unitIds);

  const counts: Record<string, number> = {};
  const seen: Record<string, Set<string>> = {};
  for (const l of (lessons || []) as Array<{ content: any }>) {
    const vocab = l.content?.vocabulary || [];
    for (const v of vocab) {
      const img = v.image_url || v.image;
      if (!img || !v.term || v.term.length > 28) continue;
      const slug = classifyVocab(v.translation);
      if (!slug) continue;
      const key = v.term.toLowerCase().trim();
      if (!seen[slug]) seen[slug] = new Set();
      if (seen[slug].has(key)) continue;
      seen[slug].add(key);
      counts[slug] = (counts[slug] || 0) + 1;
    }
  }

  return THEMES
    .map((t) => ({ ...t, count: counts[t.slug] || 0 }))
    .filter((t) => t.count >= MIN_ITEMS)
    .sort((a, b) => b.count - a.count);
}

export default async function GamesLobbyPage({ params }: Props) {
  const { language } = await params;
  const langName = language.charAt(0).toUpperCase() + language.slice(1);
  const themes = await getThemeCounts(language);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-sm font-medium uppercase tracking-wider text-amber-600">Games</div>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Pick a theme to play with
        </h1>
        <p className="mt-1 text-gray-600">
          Quick rounds drawn from your {langName} vocabulary. Tap a theme, then choose a game.
        </p>
      </header>

      {themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No themed vocabulary is ready for {langName} games yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {themes.map((t) => (
            <Link
              key={t.slug}
              href={`/learn/${language}/games/${t.slug}`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} p-5 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <div className="text-4xl">{t.emoji}</div>
              <h2 className="mt-3 font-heading text-lg font-bold">{t.label}</h2>
              <div className="mt-1 text-xs text-white/85">{t.count} words</div>
              <span className="mt-4 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                Play →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
