"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Clock, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { PickLink } from "./pick-link";

export interface LiteLesson {
  id: string;
  slug: string;
  title: string;
  title_translation?: string;
  level: string;
  language?: string;
  hero_image_url?: string;
  duration_minutes?: number | null;
  section_count: number;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LAST = LEVELS.length - 1;
const BANDS: { label: string; at: number }[] = [
  { label: "Beginner", at: 0.5 },
  { label: "Intermediate", at: 2.5 },
  { label: "Advanced", at: 4.5 },
];

export function LevelExplorer({
  lessons,
  children,
}: {
  lessons: LiteLesson[];
  /** Category grid, shown when the full A1–C2 range is selected. */
  children: ReactNode;
}) {
  const [minIdx, setMin] = useState(0);
  const [maxIdx, setMax] = useState(LAST);
  const minRef = useRef(0);
  const maxRef = useRef(LAST);
  const trackRef = useRef<HTMLDivElement>(null);

  const isFull = minIdx === 0 && maxIdx === LAST;
  const filtered = isFull
    ? []
    : lessons.filter((l) => {
        const i = LEVELS.indexOf(l.level);
        return i >= minIdx && i <= maxIdx;
      });

  function idxFromClientX(x: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const frac = (x - rect.left) / rect.width;
    return Math.round(Math.min(1, Math.max(0, frac)) * LAST);
  }

  function startDrag(which: "min" | "max", e: React.PointerEvent) {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const i = idxFromClientX(ev.clientX);
      if (which === "min") {
        const v = Math.min(i, maxRef.current);
        minRef.current = v;
        setMin(v);
      } else {
        const v = Math.max(i, minRef.current);
        maxRef.current = v;
        setMax(v);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const pct = (i: number) => (i / LAST) * 100;

  return (
    <div>
      {/* Dual-handle level range slider */}
      <div className="mx-auto max-w-xl select-none">
        <div ref={trackRef} className="relative h-2 rounded-full bg-gray-200">
          {/* coloured per-level segments (dimmed outside the selected range) */}
          {LEVELS.slice(0, LAST).map((lv, i) => {
            const t = getLevelTheme(lv);
            const inRange = i >= minIdx && i <= maxIdx - 1;
            return (
              <span
                key={lv}
                className={`absolute top-0 h-2 ${t.accentBg} ${inRange ? "" : "opacity-25"}`}
                style={{ left: `${pct(i)}%`, width: `${pct(1)}%` }}
              />
            );
          })}
          {/* tick dots */}
          {LEVELS.map((lv, i) => (
            <span
              key={lv}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
              style={{ left: `${pct(i)}%` }}
            />
          ))}
          {/* min + max handles */}
          {(["min", "max"] as const).map((which) => {
            const i = which === "min" ? minIdx : maxIdx;
            return (
              <button
                key={which}
                type="button"
                onPointerDown={(e) => startDrag(which, e)}
                aria-label={`${which === "min" ? "Minimum" : "Maximum"} level: ${LEVELS[i]}`}
                className="absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-primary bg-white shadow-md transition active:cursor-grabbing active:scale-110"
                style={{ left: `${pct(i)}%` }}
              >
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow">
                  {LEVELS[i]}
                </span>
              </button>
            );
          })}
        </div>

        {/* band labels */}
        <div className="relative mt-3 h-4">
          {BANDS.map((b) => (
            <span
              key={b.label}
              className="absolute -translate-x-1/2 text-[11px] font-semibold text-gray-400"
              style={{ left: `${pct(b.at)}%` }}
            >
              {b.label}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-xs text-gray-400">
          {isFull ? "Drag the handles to filter by level range" : `Levels ${LEVELS[minIdx]} – ${LEVELS[maxIdx]}`}
        </p>
      </div>

      {/* Results */}
      <div className="mt-10">
        {isFull ? (
          children
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {LEVELS[minIdx]} – {LEVELS[maxIdx]}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {filtered.length} lesson{filtered.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => {
                  minRef.current = 0;
                  maxRef.current = LAST;
                  setMin(0);
                  setMax(LAST);
                }}
                className="ml-auto text-sm font-semibold text-primary hover:underline"
              >
                ← Back to categories
              </button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No lessons in this range yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((l) => (
                  <FilteredCard key={l.id} lesson={l} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilteredCard({ lesson }: { lesson: LiteLesson }) {
  const t = getLevelTheme(lesson.level);
  return (
    <PickLink
      href={`/library/lesson/${lesson.slug}`}
      slug={lesson.slug}
      title={lesson.title}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-medium"
    >
      <div className="relative aspect-[16/10] w-full bg-gray-100">
        {lesson.hero_image_url ? (
          <Image
            src={lesson.hero_image_url}
            alt={lesson.title}
            fill
            sizes="(max-width:640px) 100vw, 320px"
            className="object-contain transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-40">{lesson.language === "en" ? "🇬🇧" : "🇫🇷"}</div>
        )}
        <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow ${t.accentBg}`}>
          {lesson.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading font-bold text-primary">{lesson.title}</h3>
        {lesson.title_translation ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{lesson.title_translation}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-gray-500">
          {lesson.duration_minutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lesson.duration_minutes} min
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> {lesson.section_count} steps
          </span>
        </div>
      </div>
    </PickLink>
  );
}
