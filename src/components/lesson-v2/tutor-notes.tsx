"use client";

import { useState, type ReactNode } from "react";
import { Lightbulb, ChevronDown } from "lucide-react";
import type { LessonView } from "@/lib/lessons/types";

interface TutorNotesProps {
  view: LessonView;
  instruction?: string;
  children?: ReactNode;
}

export function TutorNotes({ view, instruction, children }: TutorNotesProps) {
  const [open, setOpen] = useState(false);
  if (view !== "tutor") return null;
  if (!instruction && !children) return null;

  return (
    <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/70 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 font-medium text-primary-700 hover:bg-primary-50"
      >
        <span className="inline-flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Tutor notes
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-primary-100 px-3 py-3 space-y-2 text-primary-700">
          {instruction ? <p>{instruction}</p> : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
