"use client";

// The lesson shelf, as a room panel.
//
// What this replaces: `lesson-browser.tsx`, which was an IFRAME of /library
// floating in a modal. Three things were wrong with that, in ascending order
// of seriousness:
//
//   1. It re-downloaded a full marketing page — nav, footer, fonts, its own
//      React tree — inside a room that already had every lesson in memory as
//      the `lessons` prop.
//   2. Cross-origin postMessage was the only way a click could get back out,
//      so picking a lesson depended on a string contract between two files
//      that had no type in common.
//   3. Only ONE PERSON COULD SEE IT. The other side of the class sat looking
//      at a frozen room while their tutor silently browsed, and then the
//      lesson changed under them with no explanation. That is the actual bug;
//      the first two are only why it was expensive.
//
// So the catalogue is a stage panel next to Call and Lesson, drawn from data
// the room already has, and its OPEN/CLOSED state and its filters ride the
// room channel — when the tutor opens the shelf, the student's stage follows
// them to it and shows the same shortlist. Scroll position deliberately does
// not follow: being dragged through a grid is unpleasant, and looking ahead is
// the one useful thing a student can do while the tutor decides.

import { useMemo, useState } from "react";
import { BookOpen, Check, Clock, Search, Sparkles, X } from "lucide-react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { cn } from "@/lib/utils";
import type { PickerLesson } from "./lesson-picker";

/** Levels get their own filter row when the catalogue actually spans them. */
function levelsIn(lessons: PickerLesson[]): string[] {
  const seen = new Set<string>();
  for (const l of lessons) if (l.level) seen.add(l.level);
  return [...seen].sort();
}

export function MaterialsPanel({
  lessons,
  currentId,
  canChoose,
  onPick,
  onPropose,
  onFilterChange,
  followingName,
  remoteFilter,
}: {
  lessons: PickerLesson[];
  currentId?: string | null;
  /** The tutor opens material for both. A student can only suggest. */
  canChoose: boolean;
  onPick: (l: PickerLesson) => void;
  onPropose: (l: PickerLesson) => void;
  onFilterChange: (q: string, level: string | null) => void;
  /** Set when the OTHER side opened this shelf, so we can say whose it is. */
  followingName: string | null;
  /** Their search + level, mirrored onto ours so both see one shortlist. */
  remoteFilter: { q: string; level: string | null; at: number } | null;
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string | null>(null);
  // Whichever side typed most recently owns the shortlist. Tracking "who typed
  // last" rather than merging two filters avoids the state where each person
  // is quietly filtering the other's results away.
  const [localAt, setLocalAt] = useState(0);
  const remoteWins = Boolean(remoteFilter && remoteFilter.at > localAt);
  const activeQ = remoteWins ? remoteFilter!.q : q;
  const activeLevel = remoteWins ? remoteFilter!.level : level;

  const levels = useMemo(() => levelsIn(lessons), [lessons]);

  const filtered = useMemo(() => {
    const term = activeQ.trim().toLowerCase();
    return lessons.filter((l) => {
      if (activeLevel && l.level !== activeLevel) return false;
      if (!term) return true;
      const hay = `${l.title} ${l.level} ${(l.topic_tags || []).join(" ")}`.toLowerCase();
      return hay.includes(term);
    });
  }, [lessons, activeQ, activeLevel]);

  function setFilters(nextQ: string, nextLevel: string | null) {
    setQ(nextQ);
    setLevel(nextLevel);
    setLocalAt(Date.now());
    onFilterChange(nextQ, nextLevel);
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* ------------------------------------------------------------ TOOLS */}
      <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-primary-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={activeQ}
              onChange={(e) => setFilters(e.target.value, activeLevel)}
              placeholder="Search lessons by title, level or topic…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {activeQ ? (
              <button
                type="button"
                onClick={() => setFilters("", activeLevel)}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <span className="hidden shrink-0 text-xs font-medium text-slate-400 sm:inline">
            {filtered.length} of {lessons.length}
          </span>
        </div>

        {levels.length > 1 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <FilterChip
              on={activeLevel === null}
              onClick={() => setFilters(activeQ, null)}
              label="All levels"
            />
            {levels.map((lv) => (
              <FilterChip
                key={lv}
                on={activeLevel === lv}
                onClick={() => setFilters(activeQ, activeLevel === lv ? null : lv)}
                label={lv}
              />
            ))}
          </div>
        ) : null}

        {followingName ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-600">
            <Sparkles className="h-3 w-3" />
            {followingName} is choosing what you&apos;ll work on
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------------- GRID */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              Nothing matches {activeQ ? `“${activeQ}”` : "these filters"}.
            </p>
            <button
              type="button"
              onClick={() => setFilters("", null)}
              className="mt-2 text-xs font-semibold text-primary-500 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, 300).map((l) => (
              <MaterialCard
                key={l.id}
                lesson={l}
                active={l.id === currentId}
                canChoose={canChoose}
                onSelect={() => (canChoose ? onPick(l) : onPropose(l))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
        on
          ? "bg-primary-500 text-white shadow-sm"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      )}
    >
      {label}
    </button>
  );
}

function MaterialCard({
  lesson,
  active,
  canChoose,
  onSelect,
}: {
  lesson: PickerLesson;
  active: boolean;
  canChoose: boolean;
  onSelect: () => void;
}) {
  const theme = getLevelTheme(lesson.level);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
        active ? "border-primary-400 ring-2 ring-primary-200" : "border-slate-200"
      )}
      title={canChoose ? `Open “${lesson.title}” for both of you` : `Suggest “${lesson.title}”`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {lesson.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lesson.hero_image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-7 w-7 text-slate-300" />
          </div>
        )}
        {/* A scrim, not a solid bar: covers vary wildly and a level chip has to
            stay legible on a white photograph and a dark one alike. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/35 to-transparent" />
        <span
          className={cn(
            "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
            theme.accentBg
          )}
        >
          {lesson.level}
        </span>
        {active ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <Check className="h-3 w-3" /> Open
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-primary-600">
          {lesson.title}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          {lesson.duration_minutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes} min
            </span>
          ) : null}
          {(lesson.topic_tags || []).slice(0, 2).map((t) => (
            <span key={t} className="truncate rounded-full bg-slate-100 px-2 py-0.5 font-medium">
              {t}
            </span>
          ))}
        </div>
        {!canChoose ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-600 opacity-0 transition group-hover:opacity-100">
            Suggest to your tutor
          </span>
        ) : null}
      </div>
    </button>
  );
}
