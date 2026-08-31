"use client";

// The reading surface: a section list, one section at a time, and exercises
// that mark themselves.
//
// Progress lives in the database via the activity events (PRD §8.7) rather
// than localStorage, because "opened on 3 separate days" is the engagement
// metric the whole funnel is judged on and it has to survive a new device.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/client";
import { checkAnswer, type Verdict } from "@/lib/workbook/check";
import { ChevronLeft, ChevronRight, List, X, Check, Info, Volume2 } from "lucide-react";

export interface Section { id: string; title: string; part: string; html: string }
export type ExerciseMap = Record<string, { i: number; text: string; answers: string[] }[]>;
export interface Clip {
  id: string; text: string;
  kind: "dialogue" | "drill" | "phrase" | "conj";
  slow: boolean; section: string | null;
}

export function ReaderShell({
  sections, exercises, audio, current, hasAudio,
}: {
  sections: Section[];
  exercises: ExerciseMap;
  audio: Record<string, Clip[]>;
  current?: string;
  hasAudio: boolean;
}) {
  const startIndex = Math.max(0, sections.findIndex((s) => s.id === current));
  const [index, setIndex] = useState(startIndex === -1 ? 0 : startIndex);
  const [navOpen, setNavOpen] = useState(false);
  const section = sections[index];

  // Which exercises belong to this section: the numbers mentioned in its HTML.
  const sectionExercises = useMemo(() => {
    const nums = new Set<string>();
    for (const m of section.html.matchAll(/Exercice\s+(\d+)/g)) nums.add(m[1]);
    return [...nums].filter((n) => exercises[n]).map((n) => ({ n, items: exercises[n] }));
  }, [section, exercises]);

  useEffect(() => {
    trackEvent("workbook_section_opened", { metadata: { section: section.id } });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const url = new URL(window.location.href);
    url.searchParams.set("s", section.id);
    window.history.replaceState({}, "", url);
  }, [section.id]);

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:px-6">
      {/* Section list */}
      <aside
        className={`${navOpen ? "fixed inset-0 z-40 overflow-y-auto bg-background p-5" : "hidden"} lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:p-0`}
      >
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <span className="font-semibold">Contents</span>
          <button onClick={() => setNavOpen(false)} aria-label="Close contents">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="space-y-0.5 text-sm">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => { setIndex(i); setNavOpen(false); }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-left ${
                  i === index ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                }`}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setNavOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm lg:hidden"
          >
            <List className="h-4 w-4" /> Contents
          </button>
          <p className="truncate text-sm text-muted-foreground">{section.part}</p>
          <Link href="/workbook" className="shrink-0 text-sm text-primary underline-offset-4 hover:underline">
            My workbook
          </Link>
        </div>

        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {section.title}
        </h1>

        <article
          className="wb prose-reader mt-5"
          dangerouslySetInnerHTML={{ __html: section.html }}
        />

        {sectionExercises.map(({ n, items }) => (
          <ExerciseBlock key={n} n={n} items={items} />
        ))}

        <AudioForSection clips={audio[section.id] ?? []} owned={hasAudio} />

        <nav className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-5">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">
            {index + 1} / {sections.length}
          </span>
          <button
            onClick={() => setIndex((i) => Math.min(sections.length - 1, i + 1))}
            disabled={index === sections.length - 1}
            className="inline-flex items-center gap-1.5 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </main>
    </div>
  );
}

function ExerciseBlock({ n, items }: { n: string; items: { i: number; text: string; answers: string[] }[] }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done === items.length && items.length) {
      trackEvent("workbook_exercise_completed", { metadata: { exercise: n } });
    }
  }, [done, items.length, n]);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold text-primary">Exercice {n} — check yourself</p>
      <ol className="space-y-4">
        {items.map((it) => (
          <Item key={it.i} n={n} item={it} onFirstCorrect={() => setDone((d) => d + 1)} />
        ))}
      </ol>
    </section>
  );
}

function Item({
  n, item, onFirstCorrect,
}: {
  n: string;
  item: { i: number; text: string; answers: string[] };
  onFirstCorrect: () => void;
}) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [canonical, setCanonical] = useState("");
  const [counted, setCounted] = useState(false);

  const [before, after] = item.text.split("______");

  function mark() {
    if (!value.trim()) return;
    const r = checkAnswer(value, { answers: item.answers });
    setVerdict(r.verdict);
    setCanonical(r.canonical);
    trackEvent("workbook_exercise_attempted", { metadata: { exercise: n, item: item.i } });
    if (r.verdict !== "incorrect" && !counted) { setCounted(true); onFirstCorrect(); }
  }

  const ok = verdict === "correct" || verdict === "accent";

  return (
    <li className="text-[15px] leading-relaxed">
      <span>{item.i}. {before}</span>
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); setVerdict(null); }}
        onBlur={mark}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); mark(); } }}
        aria-label={`Exercise ${n}, item ${item.i}`}
        autoCapitalize="off" autoCorrect="off" spellCheck={false}
        className={`mx-1 w-40 rounded-md border-2 px-2 py-1 outline-none ${
          verdict === null ? "border-border focus:border-primary"
          : ok ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50"
        }`}
      />
      <span>{after}</span>
      {verdict && (
        <p role="status" className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${
          verdict === "correct" ? "text-emerald-700"
          : verdict === "accent" ? "text-amber-700" : "text-red-600"
        }`}>
          {verdict === "correct" ? <Check className="h-4 w-4" />
            : verdict === "accent" ? <Info className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {verdict === "correct" ? "Correct."
            : verdict === "accent" ? `Correct — mind the accent: ${canonical}`
            : `Not quite — ${canonical}`}
        </p>
      )}
    </li>
  );
}


/* The audio pack, where it belongs: beside the thing it is reading.
   Rendered for everyone who has a clip on this section — a workbook buyer who
   skipped the $17 bump sees what they are missing, which is a better offer
   than a banner and is the only place the pack sells itself. */
function AudioForSection({ clips, owned }: { clips: Clip[]; owned: boolean }) {
  if (!clips.length) return null;

  const label: Record<Clip["kind"], string> = {
    dialogue: "Dialogue",
    drill: "Pronunciation",
    phrase: "Phrase",
    conj: "Conjugation",
  };

  return (
    <section id="audio" className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">
          Listen {clips.length > 1 && <span className="font-normal text-muted-foreground">· {clips.length} clips</span>}
        </h2>
      </div>

      {owned ? (
        <ul className="space-y-3">
          {clips.map((c) => (
            <li key={c.id}>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {label[c.kind]}
              </p>
              <p className="mb-1.5 text-sm">{c.text.slice(0, 120)}{c.text.length > 120 ? "…" : ""}</p>
              <div className="flex flex-wrap gap-3">
                <audio controls preload="none" className="h-9 max-w-full"
                  src={`/api/workbook/audio/${c.id}-normal.m4a`} />
                {c.slow && (
                  <audio controls preload="none" className="h-9 max-w-full"
                    src={`/api/workbook/audio/${c.id}-slow.m4a`} />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {clips.length === 1 ? "There is a recording" : `There are ${clips.length} recordings`}{" "}
            for this section — read at natural speed and again slowly. Liaison and
            nasal vowels are hard to learn from a page.
          </p>
          <Link href="/workbook" className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            Add the audio pack — $17
          </Link>
        </>
      )}
    </section>
  );
}
