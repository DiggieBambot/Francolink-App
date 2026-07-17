"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { categoriesForLanguage } from "@/lib/lessons/categories";
import { LevelExplorer, type LiteLesson } from "./level-explorer";
import { LanguageTabs } from "./language-tabs";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface BrowserLesson extends LiteLesson {
  category: string;
  language: string;
}

// Owns the language + category-grid rendering entirely on the client, so the
// /library page itself reads no request-time data and can be fully ISR-cached.
export function LibraryBrowser({ lessons }: { lessons: BrowserLesson[] }) {
  const [lang, setLang] = useState<"fr" | "en">("fr");

  // Honour a ?lang deep link + keep the URL in sync without a server round-trip.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("lang");
    if (p === "en" || p === "fr") setLang(p);
  }, []);

  function selectLang(next: "fr" | "en") {
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.toString());
  }

  const frCount = useMemo(() => lessons.filter((l) => l.language === "fr").length, [lessons]);
  const enCount = useMemo(() => lessons.filter((l) => l.language === "en").length, [lessons]);

  const langLessons = useMemo(() => lessons.filter((l) => l.language === lang), [lessons, lang]);
  const categories = useMemo(() => categoriesForLanguage(lang), [lang]);

  const byCat = useMemo(() => {
    const m = new Map<string, { count: number; levels: Set<string>; cover?: string }>();
    for (const l of langLessons) {
      const e = m.get(l.category) || { count: 0, levels: new Set<string>() };
      e.count++;
      e.levels.add(l.level);
      if (!e.cover && l.hero_image_url) e.cover = l.hero_image_url;
      m.set(l.category, e);
    }
    return m;
  }, [langLessons]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <LanguageTabs activeLang={lang} frCount={frCount} enCount={enCount} onSelect={selectLang} />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <LevelExplorer lessons={langLessons}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const agg = byCat.get(cat.slug);
              const count = agg?.count || 0;
              const levels = agg ? LEVELS.filter((l) => agg.levels.has(l)) : [];
              const cover = agg?.cover;
              return (
                <Link
                  key={cat.slug}
                  href={`/library/${cat.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-medium"
                >
                  <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${cat.gradient}`}>
                    {cover ? (
                      <Image
                        src={cover}
                        alt={cat.name}
                        fill
                        sizes="(max-width:640px) 100vw, 380px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/85 via-primary-900/30 to-transparent" />
                    <span className="absolute right-3 top-3 text-2xl drop-shadow">{cat.emoji}</span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl font-bold text-white drop-shadow-sm">{cat.name}</h2>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                          {count} lessons
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm leading-relaxed text-gray-600">{cat.description}</p>
                    {levels.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {levels.map((lv) => {
                          const t = getLevelTheme(lv);
                          return (
                            <span
                              key={lv}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.softBg} ${t.softText}`}
                            >
                              {lv}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </LevelExplorer>

        {langLessons.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-500">
            No published {lang === "en" ? "English" : "French"} lessons yet. Check back soon!
          </p>
        ) : null}
      </div>
    </>
  );
}
