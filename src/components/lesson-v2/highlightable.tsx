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
 * Wraps a French phrase so that during a live session the tutor can click to
 * highlight it, and the student sees the same highlight in real time. Outside
 * of a session (e.g. on /preview) it renders the children plainly with no
 * interaction.
 */
export function Highlightable({ id, text, sectionIdx, children, className = "" }: HighlightableProps) {
  const room = useLessonRoom();
  if (!room) return <>{children}</>;

  const isHighlighted = room.highlights.has(id);
  const interactive = room.canHighlight;

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
      className={`relative rounded transition-colors ${
        isHighlighted
          ? "bg-yellow-300 text-slate-900 px-1.5 py-0.5 shadow-sm"
          : ""
      } ${interactive ? "cursor-pointer hover:bg-yellow-100" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
