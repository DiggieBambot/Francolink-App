"use client";

import { useState } from "react";
import { X, Search, BookOpen } from "lucide-react";
import { getLevelTheme } from "@/lib/lessons/level-theme";

export interface PickerLesson {
  id: string;
  slug: string;
  title: string;
  level: string;
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
  const filtered = q.trim()
    ? lessons.filter((l) => (l.title + " " + l.level).toLowerCase().includes(q.trim().toLowerCase()))
    : lessons;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-[8vh] backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons…"
            className="flex-1 text-sm outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No lessons match.</p>
          ) : (
            filtered.slice(0, 200).map((l) => {
              const t = getLevelTheme(l.level);
              const active = l.id === currentId;
              return (
                <button
                  key={l.id}
                  onClick={() => onPick(l)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-slate-50 ${
                    active ? "bg-slate-100" : ""
                  }`}
                >
                  <span className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded px-1.5 text-[10px] font-bold uppercase text-white ${t.accentBg}`}>
                    {l.level}
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-900">{l.title}</span>
                  {active ? <span className="text-[10px] font-semibold text-slate-400">current</span> : <BookOpen className="h-3.5 w-3.5 text-slate-300" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
