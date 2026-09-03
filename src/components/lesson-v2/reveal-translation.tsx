"use client";

import { useState } from "react";
import { Languages, Eye } from "lucide-react";
import { useLessonRoom } from "./lesson-room-context";

interface RevealTranslationProps {
  text?: string;
  /** Stable identifier; defaults to the text itself. */
  id?: string;
  size?: "xs" | "sm";
  hint?: string;
  className?: string;
}

/**
 * Tutor-gated translation reveal.
 *
 * - Outside a session (e.g. /preview/from-doc): self-serve. Anyone can click
 *   the chip to reveal/hide.
 * - Inside a session (LessonRoom / DemoRoom):
 *     - Tutor sees a chip and toggles. The state is broadcast to the student.
 *     - Student sees nothing until the tutor reveals. No chip, no hint.
 *
 * Pedagogy: matches a real classroom — the tutor controls when L1 scaffolding
 * is provided. Eliminates the translation-reflex crutch for self-study.
 */
export function RevealTranslation({
  text,
  id,
  size = "xs",
  hint = "Show translation",
  className = "",
}: RevealTranslationProps) {
  const room = useLessonRoom();
  const [localShown, setLocalShown] = useState(false);

  if (!text) return null;
  const key = id || text;
  const sizeCls = size === "sm" ? "text-sm" : "text-xs";

  // Outside a session → self-serve toggle.
  if (!room) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLocalShown((v) => !v);
        }}
        className={`inline-flex items-center gap-1 ${sizeCls} italic transition-colors ${
          localShown ? "text-slate-600" : "text-slate-400 not-italic hover:text-slate-700"
        } ${className}`}
        aria-label={localShown ? "Hide translation" : "Show translation"}
      >
        <Languages className="h-3 w-3 shrink-0 opacity-70" />
        {localShown ? text : hint}
      </button>
    );
  }

  const sharedShown = room.revealedTranslations.has(key);

  // Student: silent reader. Renders only when the tutor reveals; no clickable UI.
  if (room.currentRole === "student") {
    if (!sharedShown) return null;
    return (
      <span className={`inline-flex items-center gap-1 ${sizeCls} italic text-slate-600 ${className}`}>
        <Languages className="h-3 w-3 shrink-0 opacity-70" />
        {text}
      </span>
    );
  }

  // Tutor: clickable chip that broadcasts to the student. Indicator shows
  // when this translation is currently being shared.
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        room.toggleTranslation(key);
      }}
      className={`inline-flex items-center gap-1 ${sizeCls} transition-colors ${
        sharedShown
          ? "rounded bg-primary-50 px-1.5 py-0.5 italic text-primary-700"
          : "italic text-slate-400 hover:text-slate-700 not-italic"
      } ${className}`}
      aria-label={sharedShown ? "Hide translation from student" : "Show translation to student"}
      title={sharedShown ? "Visible to student — click to hide" : "Click to share with student"}
    >
      {sharedShown ? <Eye className="h-3 w-3" /> : <Languages className="h-3 w-3 opacity-70" />}
      {sharedShown ? text : hint}
    </button>
  );
}
