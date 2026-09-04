"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLessonRoom } from "./lesson-room-context";

interface StepControlsProps {
  totalSteps: number;
}

/**
 * Tutor-only floating controls to advance/retreat the current shared step.
 * Both panels scroll to the broadcast section.
 */
export function StepControls({ totalSteps }: StepControlsProps) {
  const room = useLessonRoom();
  if (!room || room.currentRole !== "tutor") return null;

  const current = room.currentSectionIdx ?? 0;
  const goto = (n: number) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, n));
    room.setCurrentSectionIdx(clamped);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={() => goto(current - 1)}
        disabled={current <= 0}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous step"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-semibold text-slate-700">
        Step {current + 1} / {totalSteps}
      </span>
      <button
        type="button"
        onClick={() => goto(current + 1)}
        disabled={current >= totalSteps - 1}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next step"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
