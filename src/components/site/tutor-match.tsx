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
  specialty: string;
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

function Question({ n, title, hint, children }: {
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

export function TutorMatch({
  languages,
  levels,
  specialtiesFor,
  initial,
  levelFromPlacement,
  countFor,
  onApply,
  onSkip,
}: {
  /** Language codes that have at least one tutor. */
  languages: string[];
  levels: string[];
  /** Goals offered by tutors of a language, most common first. */
  specialtiesFor: (lang: string) => string[];
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
  const [allGoals, setAllGoals] = useState(false);
  const goals = useMemo(() => specialtiesFor(a.lang), [a.lang, specialtiesFor]);
  // Keep a chosen goal visible even when it falls outside the short list.
  const shownGoals = allGoals
    ? goals
    : [...goals.slice(0, 8), ...(goals.indexOf(a.specialty) >= 8 ? [a.specialty] : [])];

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
          <Question n={1} title="What do you want to learn?">
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
            n={languages.length > 1 ? 2 : 1}
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

        <Question n={languages.length > 1 ? 3 : 2} title="When can you take lessons?">
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
          <Question n={languages.length > 1 ? 4 : 3} title="What's your main goal?">
            {shownGoals.map((s) => (
              <Option key={s} active={a.specialty === s} onClick={() => set({ specialty: s })}>
                {s}
              </Option>
            ))}
            <Option
              active={a.specialty === MATCH_ANY}
              onClick={() => set({ specialty: MATCH_ANY })}
            >
              General / not sure
            </Option>
            {!allGoals && goals.length > 8 && (
              <button
                type="button"
                onClick={() => setAllGoals(true)}
                className="px-3 py-2 text-sm font-semibold text-primary underline underline-offset-4"
              >
                More goals ({goals.length - 8})
              </button>
            )}
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
