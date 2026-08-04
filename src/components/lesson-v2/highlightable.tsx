"use client";

import type { ReactNode } from "react";
import { useLessonRoom } from "./lesson-room-context";

interface HighlightableProps {
  id: string;
  text: string;
  sectionIdx: number;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a French phrase so that during a live session either participant can
 * click to highlight it, and the other sees the same highlight in real time.
 * The tutor's and the student's highlights are coloured differently so each can
 * tell their own marks from the other's. Outside of a session (e.g. on /preview)
 * it renders the children plainly with no interaction.
 */
export function Highlightable({ id, text, sectionIdx, children, className = "" }: HighlightableProps) {
  const room = useLessonRoom();
  if (!room) return <>{children}</>;

  const byRole = room.highlights.get(id); // "tutor" | "student" | undefined
  const interactive = room.canHighlight;

  // Distinct colours per author so each side recognises their own highlights.
  const highlightClass = byRole
    ? byRole === "tutor"
      ? "bg-amber-300 text-slate-900 px-1.5 py-0.5 shadow-sm"
      : "bg-sky-300 text-slate-900 px-1.5 py-0.5 shadow-sm"
    : "";

  return (
    <span
      data-highlight-id={id}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              room.toggleHighlight({ id, text, sectionIdx });
            }
          : undefined
      }
      className={`relative rounded transition-colors ${highlightClass} ${
        interactive && !byRole ? "cursor-pointer hover:bg-amber-100" : interactive ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
