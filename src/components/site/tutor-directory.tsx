"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { TutorCard } from "@/components/site/tutor-card";
import { TutorWaitlistForm } from "@/components/site/tutor-waitlist-form";
import type { Tier, TierPricing } from "@/lib/site/pricing";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { cn } from "@/lib/utils";

const ANY = "any";

/**
 * Languages the directory always offers, whether or not a tutor is live for
 * each one. Advertising a language we can't staff yet is deliberate: the empty
 * state collects demand instead of showing nothing, which tells us what to
 * recruit for. Any other language a live tutor teaches is appended.
 */
const FEATURED_LANGUAGES = ["fr", "en", "es"];

/**
 * Client-side filtering over the full directory. The list is small enough
 * (tens of tutors, not thousands) that filtering in the browser beats a
 * round-trip per filter change — revisit if the directory grows past ~200.
 */
export function TutorDirectory({
  tutors,
  pricing,
}: {
  tutors: TutorCardData[];
  pricing: Record<Tier, TierPricing>;
}) {
  const [language, setLanguage] = useState(ANY);
  const [level, setLevel] = useState(ANY);

  // Featured languages first, then anything else a live tutor actually teaches.
  const languages = useMemo(() => {
    const taught = new Set(tutors.flatMap((t) => t.teaches));
    const extra = [...taught].filter((c) => !FEATURED_LANGUAGES.includes(c)).sort();
    return [...FEATURED_LANGUAGES, ...extra];
  }, [tutors]);

  const levels = useMemo(
    () => Array.from(new Set(tutors.flatMap((t) => t.levels))).sort(),
    [tutors]
  );

  const visible = tutors.filter(
    (t) =>
      (language === ANY || t.teaches.includes(language)) &&
      (level === ANY || t.levels.includes(level))
  );

  // How many tutors exist for the chosen language, ignoring the level filter —
  // so "none at B2" reads differently from "none at all".
  const inLanguage =
    language === ANY
      ? tutors.length
      : tutors.filter((t) => t.teaches.includes(language)).length;

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-primary mr-1">
            I want to learn
          </span>
          <button
            type="button"
            onClick={() => setLanguage(ANY)}
            aria-pressed={language === ANY}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
              language === ANY
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Any language
          </button>
          {languages.map((code) => {
            const count = tutors.filter((t) => t.teaches.includes(code)).length;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors inline-flex items-center gap-2",
                  language === code
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {LANGUAGE_LABEL[code] ?? code.toUpperCase()}
                <span
                  className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                    count === 0
                      ? language === code
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-500"
                      : language === code
                        ? "bg-white/20 text-white"
                        : "bg-secondary-100 text-secondary-700"
                  )}
                >
                  {count === 0 ? "soon" : count}
                </span>
              </button>
            );
          })}
        </div>

        {levels.length > 0 && inLanguage > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-primary mr-1">
              <SlidersHorizontal className="w-4 h-4" />
              Level
            </span>
            {[{ value: ANY, label: "All" }, ...levels.map((l) => ({ value: l, label: l }))].map(
              (opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  aria-pressed={level === opt.value}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                    level === opt.value
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {opt.label}
                </button>
              )
            )}
            <span className="ml-auto text-sm text-gray-500">
              {visible.length} {visible.length === 1 ? "tutor" : "tutors"}
            </span>
          </div>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tutor) => (
            <TutorCard key={tutor.slug} tutor={tutor} pricing={pricing[tutor.tier]} />
          ))}
        </div>
      ) : inLanguage === 0 ? (
        // No tutor teaches this language yet — collect demand.
        <div className="py-10">
          <TutorWaitlistForm language={language === ANY ? null : language} />
        </div>
      ) : (
        // Tutors exist, just not at the chosen level.
        <p className="py-16 text-center text-gray-500">
          No {LANGUAGE_LABEL[language] ?? language} tutor covers that level yet —
          try another level, or{" "}
          <button
            type="button"
            onClick={() => setLevel(ANY)}
            className="font-semibold text-primary underline underline-offset-4"
          >
            clear the level filter
          </button>
          .
        </p>
      )}
    </div>
  );
}
