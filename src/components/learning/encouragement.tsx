// src/components/learning/encouragement.tsx
"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  CompletionMessage,
  CourseProgress,
  Encouragement,
  EncouragementTone,
} from "@/lib/learning/encouragement";

const TONE_STYLES: Record<EncouragementTone, string> = {
  win: "from-emerald-500 to-green-500",
  progress: "from-blue-500 to-indigo-500",
  resilience: "from-amber-500 to-orange-500",
  insight: "from-purple-500 to-fuchsia-500",
};

export type ToastMessage = Encouragement & { id: number };

/**
 * A short pop-in banner under the lesson header. Never blocks input
 * (pointer-events-none) and is announced politely to screen readers.
 */
export function EncouragementToast({
  message,
  onDone,
  durationMs = 3600,
}: {
  message: ToastMessage | null;
  onDone: () => void;
  durationMs?: number;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [message, onDone, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.id}
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.9 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`flex max-w-md items-center gap-3 rounded-2xl bg-gradient-to-r ${TONE_STYLES[message.tone]} px-4 py-3 text-white shadow-xl`}
          >
            <motion.span
              aria-hidden
              className="text-3xl"
              animate={reduce ? undefined : { rotate: [0, -14, 14, -8, 8, 0], scale: [1, 1.25, 1] }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              {message.emoji}
            </motion.span>
            <div>
              <p className="text-sm font-bold leading-tight">{message.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-white/90">{message.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * The completion-screen block: headline, a level progress bar that animates
 * from where the learner was to where they are now, and a "why it works" line.
 */
export function CompletionEncouragement({
  message,
  progress,
  level,
}: {
  message: CompletionMessage;
  progress: CourseProgress | null;
  level: string;
}) {
  const reduce = useReducedMotion();
  const pct = (n: number) => (progress && progress.total > 0 ? Math.min(100, (n / progress.total) * 100) : 0);

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 text-left"
    >
      <p className="font-bold text-gray-900">
        <span aria-hidden>{message.emoji} </span>
        {message.title}
      </p>
      <p className="mt-1 text-sm text-gray-600">{message.body}</p>

      {progress && message.levelLine && (
        <div className="mt-4">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label={`${level.toUpperCase()} progress`}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.completed}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              initial={{ width: `${pct(progress.before)}%` }}
              animate={{ width: `${pct(progress.completed)}%` }}
              transition={{ delay: reduce ? 0 : 0.8, duration: reduce ? 0 : 1, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700">{message.levelLine}</p>
        </div>
      )}

      <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
        💡 {message.insight}
      </p>
    </motion.div>
  );
}
