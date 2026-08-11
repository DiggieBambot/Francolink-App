"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { TutorCard } from "@/components/site/tutor-card";
import type { Tier, TierPricing } from "@/lib/site/pricing";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { cn } from "@/lib/utils";

const ANY = "any";

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

  const languages = useMemo(
    () => Array.from(new Set(tutors.flatMap((t) => t.teaches))).sort(),
    [tutors]
  );
  const levels = useMemo(
    () => Array.from(new Set(tutors.flatMap((t) => t.levels))).sort(),
    [tutors]
  );

  const visible = tutors.filter(
    (t) =>
      (language === ANY || t.teaches.includes(language)) &&
      (level === ANY || t.levels.includes(level))
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-10 pb-8 border-b border-gray-100">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </span>

        <FilterGroup
          label="Language"
          value={language}
          onChange={setLanguage}
          options={languages.map((code) => ({
            value: code,
            label: LANGUAGE_LABEL[code] ?? code.toUpperCase(),
          }))}
        />

        {levels.length > 0 && (
          <FilterGroup
            label="Level"
            value={level}
            onChange={setLevel}
            options={levels.map((l) => ({ value: l, label: l }))}
          />
        )}

        <span className="ml-auto text-sm text-gray-500">
          {visible.length} {visible.length === 1 ? "tutor" : "tutors"}
        </span>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tutor) => (
            <TutorCard key={tutor.slug} tutor={tutor} pricing={pricing[tutor.tier]} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-gray-500">
          No tutor matches that combination yet — try widening the filters.
        </p>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500">{label}:</span>
      {[{ value: ANY, label: "All" }, ...options].map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
            value === opt.value
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
