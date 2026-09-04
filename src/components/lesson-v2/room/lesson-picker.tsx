"use client";

import { useState } from "react";
import { X, Search, BookOpen, Clock, Check } from "lucide-react";
import { getLevelTheme } from "@/lib/lessons/level-theme";

export interface PickerLesson {
  id: string;
  slug: string;
  title: string;
  level: string;
  hero_image?: string | null;
  duration_minutes?: number | null;
  topic_tags?: string[] | null;
  /** Category slug, derived server-side from the same taxonomy the library uses. */
  category?: string | null;
}

export function LessonPicker({
  lessons,
  currentId,
  onPick,
  onClose,
}: {
  lessons: PickerLesson[];
  currentId?: string | null;
  onPick: (l: PickerLesson) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const filtered = term
    ? lessons.filter((l) =>
        (l.title + " " + l.level + " " + (l.topic_tags || []).join(" ")).toLowerCase().includes(term)
      )
    : lessons;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-[6vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / search */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <BookOpen className="h-5 w-5 text-primary-600" />
          <h2 className="text-sm font-bold text-slate-900">Choose a lesson</h2>
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg border bg-slate-50 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, level, or topic…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grid of lesson cards */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto bg-slate-50 p-4 sm:grid-cols-3">
          {filtered.length === 0 ? (
            <p className="col-span-full p-10 text-center text-sm text-slate-400">No lessons match “{q}”.</p>
          ) : (
            filtered.slice(0, 300).map((l) => {
              const t = getLevelTheme(l.level);
              const active = l.id === currentId;
              return (
                <button
                  key={l.id}
                  onClick={() => onPick(l)}
                  className={`group flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    active ? "ring-2 ring-primary-500" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-24 w-full overflow-hidden bg-slate-200">
                    {l.hero_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.hero_image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                    <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow ${t.accentBg}`}>
                      {l.level}
                    </span>
                    {active ? (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                        <Check className="h-3 w-3" /> Current
                      </span>
                    ) : null}
                  </div>
                  {/* Meta */}
                  <div className="flex flex-1 flex-col p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{l.title}</p>
                    <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                      {l.duration_minutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {l.duration_minutes} min
                        </span>
                      ) : null}
                      {l.topic_tags && l.topic_tags[0] ? (
                        <span className="truncate rounded-full bg-slate-100 px-1.5 py-0.5">{l.topic_tags[0]}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t px-4 py-2 text-center text-xs text-slate-400">
          {filtered.length} lesson{filtered.length === 1 ? "" : "s"} · click one to open it for both of you
        </div>
      </div>
    </div>
  );
}
