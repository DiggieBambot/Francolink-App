"use client";

import { useCallback, useDeferredValue, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { TutorCard as TutorCardData } from "@/lib/site/queries";
import { TIME_BANDS } from "@/lib/site/queries";
import { TutorCard } from "@/components/site/tutor-card";
import { TutorWaitlistForm } from "@/components/site/tutor-waitlist-form";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { useShortlist } from "@/lib/site/shortlist";
import { cn } from "@/lib/utils";

const ANY = "any";

/**
 * Languages the directory always offers, whether or not a tutor is live for
 * each one. Advertising a language we can't staff yet is deliberate: the empty
 * state collects demand instead of showing nothing, which tells us what to
 * recruit for. Any other language a live tutor teaches is appended.
 */
const FEATURED_LANGUAGES = ["fr", "en", "es"];

const WEEKDAYS = [
  { value: 1, short: "Mon" },
  { value: 2, short: "Tue" },
  { value: 3, short: "Wed" },
  { value: 4, short: "Thu" },
  { value: 5, short: "Fri" },
  { value: 6, short: "Sat" },
  { value: 0, short: "Sun" },
];

const TIER_OPTIONS = [
  { value: ANY, label: "Any tutor" },
  { value: "professional", label: "Professional" },
  { value: "community", label: "Community" },
];

const SORTS = [
  { value: "relevance", label: "Recommended" },
  { value: "available", label: "Most available" },
  { value: "experience", label: "Most experienced" },
];

/** Everything the rail can filter on, as it appears in the URL. */
interface Filters {
  lang: string;
  level: string;
  tier: string;
  speaks: string;
  specialty: string;
  country: string;
  day: string;   // "" | weekday number as string
  band: string;  // "" | morning | afternoon | evening
  trial: boolean;
  saved: boolean;
  sort: string;
}

function readFilters(params: URLSearchParams): Filters {
  return {
    lang: params.get("lang") || ANY,
    level: params.get("level") || ANY,
    tier: params.get("tier") || ANY,
    speaks: params.get("speaks") || ANY,
    specialty: params.get("specialty") || ANY,
    country: params.get("country") || ANY,
    day: params.get("day") || "",
    band: params.get("band") || "",
    trial: params.get("trial") === "1",
    saved: params.get("saved") === "1",
    sort: params.get("sort") || "relevance",
  };
}

/** Only non-default values go in the URL, so a plain /tutors stays clean. */
function toQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.lang !== ANY) p.set("lang", f.lang);
  if (f.level !== ANY) p.set("level", f.level);
  if (f.tier !== ANY) p.set("tier", f.tier);
  if (f.speaks !== ANY) p.set("speaks", f.speaks);
  if (f.specialty !== ANY) p.set("specialty", f.specialty);
  if (f.country !== ANY) p.set("country", f.country);
  if (f.day) p.set("day", f.day);
  if (f.band) p.set("band", f.band);
  if (f.trial) p.set("trial", "1");
  if (f.saved) p.set("saved", "1");
  if (f.sort !== "relevance") p.set("sort", f.sort);
  return p.toString();
}

function Chip({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl font-bold transition-colors inline-flex items-center gap-2",
        size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-sm rounded-lg",
        active
          ? "bg-primary text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
          value === ANY
            ? "border-gray-200 bg-gray-50 text-gray-600"
            : "border-primary bg-primary-50 text-primary"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Client-side filtering over the full directory. The list is small enough
 * (tens of tutors, not thousands) that filtering in the browser beats a
 * round-trip per filter change — revisit if the directory grows past ~200.
 *
 * Filter state lives in the URL rather than in component state alone, so a
 * filtered view can be linked, bookmarked and indexed: /tutors?lang=fr&level=B1
 * is a real page about French B1 tutors, which is worth more to us than the
 * same list behind a click.
 */
export function TutorDirectory({ tutors }: { tutors: TutorCardData[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const { slugs: saved, has: isSaved } = useShortlist();

  // The URL is the single source of truth for the filters — no mirror in
  // component state. Copying it into useState and syncing with an effect was
  // the obvious first shape and it is wrong twice over: it cascades a render
  // on every navigation, and it puts the back button out of step with the
  // chips whenever the two disagree.
  const filters = useMemo(
    () => readFilters(new URLSearchParams(params.toString())),
    [params]
  );

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const q = toQuery({ ...filters, ...patch });
      // replace, not push: twenty filter clicks should not be twenty entries
      // in the back button. scroll:false keeps the list where it was.
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  const clear = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router]
  );

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
  const specialties = useMemo(
    () => Array.from(new Set(tutors.flatMap((t) => t.specialties))).sort(),
    [tutors]
  );
  const countries = useMemo(
    () =>
      Array.from(new Set(tutors.map((t) => t.country).filter(Boolean) as string[])).sort(),
    [tutors]
  );
  const spoken = useMemo(
    () => Array.from(new Set(tutors.flatMap((t) => t.speaks))).sort(),
    [tutors]
  );

  const f = useDeferredValue(filters);

  const visible = useMemo(() => {
    const matches = tutors.filter((t) => {
      if (f.lang !== ANY && !t.teaches.includes(f.lang)) return false;
      if (f.level !== ANY && !t.levels.includes(f.level)) return false;
      if (f.tier !== ANY && t.tier !== f.tier) return false;
      if (f.speaks !== ANY && !t.speaks.includes(f.speaks)) return false;
      if (f.specialty !== ANY && !t.specialties.includes(f.specialty)) return false;
      if (f.country !== ANY && t.country !== f.country) return false;
      if (f.trial && !t.trial_available) return false;
      if (f.saved && !isSaved(t.slug)) return false;

      // Availability. A tutor with no schedule on file is "unknown", not
      // "never free" — hiding them would punish the tutor for our missing
      // data, so they stay visible until a day AND band are both chosen.
      if (f.day || f.band) {
        if (t.availability_bands.length === 0) return true;
        return t.availability_bands.some((key) => {
          const [day, band] = key.split("-");
          return (!f.day || day === f.day) && (!f.band || band === f.band);
        });
      }
      return true;
    });

    const sorted = [...matches];
    if (f.sort === "available") {
      sorted.sort((a, b) => b.availability_bands.length - a.availability_bands.length);
    } else if (f.sort === "experience") {
      sorted.sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
    }
    return sorted;
  }, [tutors, f, isSaved]);

  // How many tutors exist for the chosen language, ignoring everything else —
  // so "none at B2" reads differently from "none at all".
  const inLanguage =
    f.lang === ANY
      ? tutors.length
      : tutors.filter((t) => t.teaches.includes(f.lang)).length;

  const dirty = toQuery(filters).length > 0;

  return (
    <div>
      {/* ------------------------------------------------- LANGUAGE (primary) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-primary mr-1">I want to learn</span>
        <Chip active={f.lang === ANY} onClick={() => update({ lang: ANY })}>
          Any language
        </Chip>
        {languages.map((code) => {
          const count = tutors.filter((t) => t.teaches.includes(code)).length;
          const active = f.lang === code;
          return (
            <Chip key={code} active={active} onClick={() => update({ lang: code })}>
              {LANGUAGE_LABEL[code] ?? code.toUpperCase()}
              <span
                className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                  active
                    ? "bg-white/20 text-white"
                    : count === 0
                      ? "bg-gray-200 text-gray-500"
                      : "bg-secondary-100 text-secondary-700"
                )}
              >
                {count === 0 ? "soon" : count}
              </span>
            </Chip>
          );
        })}
      </div>

      {inLanguage > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {/* --------------------------------------------------------- LEVEL */}
          {levels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-primary mr-1 w-20">
                <SlidersHorizontal className="w-4 h-4" />
                Level
              </span>
              {[{ value: ANY, label: "All" }, ...levels.map((l) => ({ value: l, label: l }))].map(
                (opt) => (
                  <Chip
                    key={opt.value}
                    size="sm"
                    active={f.level === opt.value}
                    onClick={() => update({ level: opt.value })}
                  >
                    {opt.label}
                  </Chip>
                )
              )}
            </div>
          )}

          {/* ---------------------------------------------------- AVAILABLE */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-primary mr-1 w-20">Free on</span>
            <Chip size="sm" active={!f.day} onClick={() => update({ day: "" })}>
              Any day
            </Chip>
            {WEEKDAYS.map((d) => (
              <Chip
                key={d.value}
                size="sm"
                active={f.day === String(d.value)}
                onClick={() =>
                  update({ day: f.day === String(d.value) ? "" : String(d.value) })
                }
              >
                {d.short}
              </Chip>
            ))}
            <span className="w-px h-6 bg-gray-200 mx-1" />
            {TIME_BANDS.map((b) => (
              <Chip
                key={b.key}
                size="sm"
                active={f.band === b.key}
                onClick={() => update({ band: f.band === b.key ? "" : b.key })}
              >
                {b.label}
              </Chip>
            ))}
          </div>

          {/* ------------------------------------------------------ THE REST */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-primary mr-1 w-20">More</span>
            <Select
              label="Tutor type"
              value={f.tier}
              options={TIER_OPTIONS}
              onChange={(v) => update({ tier: v })}
            />
            {specialties.length > 0 && (
              <Select
                label="Focus"
                value={f.specialty}
                options={[
                  { value: ANY, label: "Any focus" },
                  ...specialties.map((s) => ({ value: s, label: s })),
                ]}
                onChange={(v) => update({ specialty: v })}
              />
            )}
            {spoken.length > 0 && (
              <Select
                label="Also speaks"
                value={f.speaks}
                options={[
                  { value: ANY, label: "Also speaks…" },
                  ...spoken.map((c) => ({
                    value: c,
                    label: LANGUAGE_LABEL[c] ?? c.toUpperCase(),
                  })),
                ]}
                onChange={(v) => update({ speaks: v })}
              />
            )}
            {countries.length > 1 && (
              <Select
                label="Country"
                value={f.country}
                options={[
                  { value: ANY, label: "Any country" },
                  ...countries.map((c) => ({ value: c, label: c })),
                ]}
                onChange={(v) => update({ country: v })}
              />
            )}
            <Chip
              size="sm"
              active={f.trial}
              onClick={() => update({ trial: !f.trial })}
            >
              Takes new students
            </Chip>
            {saved.length > 0 && (
              <Chip
                size="sm"
                active={f.saved}
                onClick={() => update({ saved: !f.saved })}
              >
                <Heart className={cn("w-3.5 h-3.5", f.saved && "fill-current")} />
                Saved ({saved.length})
              </Chip>
            )}
          </div>

          {/* ------------------------------------------------- SORT + RESULT */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Select
              label="Sort by"
              value={f.sort}
              options={SORTS}
              onChange={(v) => update({ sort: v })}
            />
            {dirty && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-primary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
            <span className="ml-auto text-sm text-gray-500">
              {visible.length} {visible.length === 1 ? "tutor" : "tutors"}
            </span>
          </div>
        </div>
      )}

      <div className="mt-8">
        {visible.length > 0 ? (
          // One tutor per row, marketplace-style: a wide box gives each tutor
          // room for the things people actually filter on, and a vertical list
          // scans faster than a three-up grid.
          <div className="space-y-4">
            {visible.map((tutor) => (
              <TutorCard key={tutor.slug} tutor={tutor} />
            ))}
          </div>
        ) : inLanguage === 0 ? (
          // No tutor teaches this language yet — collect demand.
          <div className="py-10">
            <TutorWaitlistForm language={f.lang === ANY ? null : f.lang} />
          </div>
        ) : (
          // Tutors exist, the filters just excluded all of them.
          <p className="py-16 text-center text-gray-500">
            No tutor matches all of those filters yet —{" "}
            <button
              type="button"
              onClick={clear}
              className="font-semibold text-primary underline underline-offset-4"
            >
              clear them
            </button>{" "}
            and try a narrower set.
          </p>
        )}
      </div>
    </div>
  );
}
