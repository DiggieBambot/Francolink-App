"use client";

// "Help me choose": four quick questions shown above the tutor directory to a
// visitor who hasn't filtered anything yet, or to a student the app sent here
// with ?match=1 (their placement level arrives as ?level=, pre-answered).
//
// It is a pre-filter, not a separate flow: answering just sets the same URL
// filters the rail below uses, so the result is an ordinary filtered
// directory the visitor can keep adjusting. The full list stays rendered
// underneath the whole time — crawlers and people who'd rather browse lose
// nothing.
//
// Times are the visitor's own (the directory re-cuts each tutor's schedule
// into their zone), and goals are plain-language outcomes that map onto tutor
// specialties (lib/site/specialties.ts).

import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import { TIME_BANDS } from "@/lib/site/queries";
import { cn } from "@/lib/utils";

export const MATCH_ANY = "any";

export interface MatchAnswers {
  lang: string;
  level: string;
  band: string; // "" = any time
  goal: string; // "" = any goal; a GOALS key (lib/site/specialties.ts)
}

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-3.5 py-2 rounded-xl text-sm font-bold transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-white text-gray-700 border border-gray-200 hover:border-primary-200 hover:bg-primary-50"
      )}
    >
      {children}
    </button>
  );
}

function Question({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-primary mb-2">
        <span className="inline-flex w-5 h-5 mr-2 items-center justify-center rounded-full bg-secondary text-white text-[11px]">
          {n}
        </span>
        {title}
        {hint && <span className="ml-2 font-medium text-gray-500">{hint}</span>}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function readViewerTz(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function TutorMatch({
  languages,
  levels,
  goalsFor,
  initial,
  levelFromPlacement,
  countFor,
  onApply,
  onSkip,
}: {
  /** Language codes that have at least one tutor. */
  languages: string[];
  levels: string[];
  /** Goals served by tutors of a language, most common first. */
  goalsFor: (lang: string) => { key: string; label: string }[];
  initial: MatchAnswers;
  /** True when the level was passed in from the student's placement test. */
  levelFromPlacement: boolean;
  /** How many tutors a set of answers would show — drives the live count. */
  countFor: (a: MatchAnswers) => number;
  onApply: (a: MatchAnswers) => void;
  onSkip: () => void;
}) {
  const [a, setA] = useState<MatchAnswers>(initial);
  const set = (patch: Partial<MatchAnswers>) => setA((prev) => ({ ...prev, ...patch }));
  const count = useMemo(() => countFor(a), [a, countFor]);
  const goals = useMemo(() => goalsFor(a.lang), [a.lang, goalsFor]);
  // Only rendered client-side (the directory shows the card after mount).
  const [viewerTz] = useState(readViewerTz);

  let n = 0;

  return (
    <section
      aria-label="Help me choose a tutor"
      className="relative mb-8 rounded-2xl border border-primary-100 bg-primary-50/60 p-5 sm:p-6"
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="Close and show all tutors"
        className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="flex items-center gap-2 font-heading font-extrabold text-xl text-primary pr-8">
        <Sparkles className="h-5 w-5 text-secondary" />
        Find your tutor in four taps
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Answer what you can, and we&apos;ll show the tutors who fit.
      </p>

      <div className="mt-5 space-y-5">
        {languages.length > 1 && (
          <Question n={++n} title="What do you want to learn?">
            {languages.map((code) => (
              <Option key={code} active={a.lang === code} onClick={() => set({ lang: code })}>
                {LANGUAGE_LABEL[code] ?? code.toUpperCase()}
              </Option>
            ))}
            <Option active={a.lang === MATCH_ANY} onClick={() => set({ lang: MATCH_ANY })}>
              Any
            </Option>
          </Question>
        )}

        {levels.length > 0 && (
          <Question
            n={++n}
            title="Your level"
            hint={levelFromPlacement && a.level !== MATCH_ANY ? "from your placement test" : undefined}
          >
            {levels.map((lv) => (
              <Option key={lv} active={a.level === lv} onClick={() => set({ level: lv })}>
                {lv}
              </Option>
            ))}
            <Option active={a.level === MATCH_ANY} onClick={() => set({ level: MATCH_ANY })}>
              Not sure
            </Option>
          </Question>
        )}

        <Question
          n={++n}
          title="When can you take lessons?"
          hint={viewerTz ? `your time (${viewerTz.replace(/_/g, " ")})` : undefined}
        >
          {TIME_BANDS.map((b) => (
            <Option key={b.key} active={a.band === b.key} onClick={() => set({ band: b.key })}>
              {b.label}
            </Option>
          ))}
          <Option active={a.band === ""} onClick={() => set({ band: "" })}>
            Any time
          </Option>
        </Question>

        {goals.length > 0 && (
          <Question n={++n} title="What's your main goal?">
            {goals.map((g) => (
              <Option key={g.key} active={a.goal === g.key} onClick={() => set({ goal: g.key })}>
                {g.label}
              </Option>
            ))}
            <Option active={a.goal === ""} onClick={() => set({ goal: "" })}>
              Not sure yet
            </Option>
          </Question>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-semibold text-gray-500 hover:text-primary"
        >
          Skip and browse all tutors
        </button>
        <button
          type="button"
          onClick={() => onApply(a)}
          disabled={count === 0}
          className="sm:ml-auto px-6 py-3 rounded-xl bg-primary text-white font-heading font-bold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {count === 0
            ? "No tutor fits all of that yet — loosen an answer"
            : `Show my ${count} ${count === 1 ? "tutor" : "tutors"}`}
        </button>
      </div>
    </section>
  );
}
