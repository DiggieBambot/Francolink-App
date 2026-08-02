"use client";

import { useMemo, useState } from "react";
import { Search, Send, ChevronRight } from "lucide-react";
import { HomeworkSendPanel } from "./homework-send-panel";
import type { HomeworkQuestion } from "@/lib/homework/types";

export interface CatalogueItem {
  slug: string;
  title: string;
  instructions: string | null;
  questions: HomeworkQuestion[];
  level: string;
  lessonTitle: string;
  assignedStudentIds: string[];
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  items: CatalogueItem[];
  students: Student[];
}

export function HomeworkCatalogue({ items, students }: Props) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const levels = useMemo(
    () => ["all", ...Array.from(new Set(items.map((i) => i.level))).sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (level !== "all" && i.level !== level) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.lessonTitle.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q)
      );
    });
  }, [items, query, level]);

  const open = items.find((i) => i.slug === openSlug) ?? null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search homework…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {levels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${level === l ? "bg-primary text-white"
                  : "border border-gray-300 bg-white text-gray-600 hover:border-primary"
              }`}
            >
              {l === "all" ? "All levels" : l}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-gray-500">
        {filtered.length} homework set{filtered.length === 1 ? "" : "s"} ready to send. Pick one to
        preview it and choose which students receive it.
      </p>

      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {filtered.map((i) => {
          const isOpen = openSlug === i.slug;
          const sentCount = i.assignedStudentIds.length;
          return (
            <li key={i.slug}>
              <button
                type="button"
                onClick={() => setOpenSlug(isOpen ? null : i.slug)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? "bg-primary-50/60" : "hover:bg-gray-50"
                }`}
              >
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {i.level}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {i.title}
                  </span>
                  <span className="block truncate text-xs text-gray-500">
                    {i.lessonTitle} · {i.questions.length} questions
                  </span>
                </span>
                {sentCount > 0 ? (
                  <span className="hidden shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline">
                    sent to {sentCount}
                  </span>
                ) : null}
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-gray-500">
            No homework matches that search.
          </li>
        ) : null}
      </ul>

      {open ? (
        <div className="mt-2">
          <HomeworkSendPanel
            key={open.slug}
            slug={open.slug}
            homeworkTitle={open.title}
            instructions={open.instructions}
            questions={open.questions}
            students={students}
            alreadyAssignedIds={open.assignedStudentIds}
          />
        </div>
      ) : (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-6 text-sm text-gray-500">
          <Send className="h-4 w-4" /> Select a homework set above to send it.
        </p>
      )}
    </div>
  );
}
