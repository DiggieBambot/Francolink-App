// src/lib/learning/encouragement.ts
//
// Copy + selection logic for the encouragement moments in the self-learning
// lesson flow. Pure functions only — rendering lives in
// components/learning/encouragement.tsx.
//
// Claims here are deliberately qualitative ("spaced practice helps memory
// stick"). Don't add invented multipliers; if a real, sourced number is
// wanted, add it to INSIGHTS below.

export type EncouragementTone = "win" | "progress" | "resilience" | "insight";

export interface Encouragement {
  emoji: string;
  title: string;
  body: string;
  tone: EncouragementTone;
}

export type EncouragementEvent =
  | { type: "phase-complete"; phase: "vocabulary" | "grammar" | "dialogue" | "culture" }
  | { type: "streak"; count: number }
  | { type: "comeback" }
  | { type: "halfway" }
  | { type: "almost-done"; remaining: number };

const pick = <T,>(items: T[], seed: number): T => items[Math.abs(seed) % items.length];

const PHASE_COMPLETE: Record<string, Encouragement[]> = {
  vocabulary: [
    { emoji: "🧠", tone: "win", title: "New words unlocked", body: "You've just added to your vocabulary. Now let's see how they fit together." },
    { emoji: "🌱", tone: "win", title: "Words planted", body: "Every word you meet today is one less surprise in a real conversation." },
  ],
  grammar: [
    { emoji: "🧩", tone: "win", title: "Grammar clicked into place", body: "Rules feel heavy at first, then they become instinct. You're on the way." },
    { emoji: "🏗️", tone: "win", title: "Solid foundations", body: "Grammar is the skeleton of the language. You just strengthened yours." },
  ],
  dialogue: [
    { emoji: "💬", tone: "win", title: "You just read a real conversation", body: "This is how people actually talk. You're already following along." },
  ],
  culture: [
    { emoji: "🌍", tone: "win", title: "Language comes with a culture", body: "Knowing the context is what makes you sound natural, not just correct." },
  ],
};

const STREAK_LINES = (count: number): Encouragement[] => [
  { emoji: "🔥", tone: "win", title: `${count} in a row!`, body: "You're in the zone. Keep this rhythm going." },
  { emoji: "⚡", tone: "win", title: `${count} correct answers straight`, body: "That's real recall, not luck. Nicely done." },
  { emoji: "🚀", tone: "win", title: `${count} in a row — unstoppable`, body: "Your brain is locking this in. Don't slow down now." },
];

const COMEBACK: Encouragement[] = [
  { emoji: "💪", tone: "resilience", title: "Bounced right back", body: "Getting it wrong then right is exactly how memories are built." },
  { emoji: "🎯", tone: "resilience", title: "Back on target", body: "Mistakes are information. You just used it." },
];

const HALFWAY: Encouragement[] = [
  { emoji: "⛰️", tone: "progress", title: "Halfway there!", body: "The hardest part of any session is getting going. You're past it." },
  { emoji: "🌗", tone: "progress", title: "You're halfway through", body: "Half done already — keep going, the finish line is closer than it feels." },
];

const ALMOST_DONE = (remaining: number): Encouragement[] => [
  {
    emoji: "🏁",
    tone: "progress",
    title: remaining === 1 ? "Last one!" : `Just ${remaining} to go`,
    body: "You're almost at the finish line. Finish strong!",
  },
];

export function pickEncouragement(event: EncouragementEvent, seed = 0): Encouragement {
  switch (event.type) {
    case "phase-complete":
      return pick(PHASE_COMPLETE[event.phase], seed);
    case "streak":
      return pick(STREAK_LINES(event.count), seed);
    case "comeback":
      return pick(COMEBACK, seed);
    case "halfway":
      return pick(HALFWAY, seed);
    case "almost-done":
      return pick(ALMOST_DONE(event.remaining), seed);
  }
}

/** Streak lengths worth a toast. Anything else would be noise. */
export const STREAK_MILESTONES = [3, 5, 8, 12];

// ── Lesson complete ────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Evidence-backed learning habits, shown as the "why it works" line. */
const INSIGHTS = [
  "Short, regular sessions beat long cramming — spacing practice out is what makes memory stick.",
  "Coming back tomorrow does more for your memory than doing double today. Consistency is the secret.",
  "Seeing the right answer after a mistake is one of the strongest ways to learn. Mistakes are part of it.",
  "Fluency is built from small daily wins, not big occasional pushes. You just added another one.",
  "Every lesson you finish makes the next one easier — you're building on what you already know.",
];

export interface CourseProgress {
  /** Lessons completed in this level *including* the one just finished. */
  completed: number;
  /** Lessons completed before this one. */
  before: number;
  total: number;
}

export interface CompletionMessage extends Encouragement {
  insight: string;
  /** Extra line tying the learner to their level goal, when there is one. */
  levelLine?: string;
}

export function lessonCompleteMessage(opts: {
  scorePercent: number;
  passed: boolean;
  level: string;
  progress: CourseProgress | null;
  seed?: number;
}): CompletionMessage {
  const { scorePercent, passed, level, progress, seed = 0 } = opts;
  const insight = pick(INSIGHTS, seed);

  if (!passed) {
    return {
      emoji: "🌱",
      tone: "resilience",
      title: "You're closer than you think",
      body: "Every attempt strengthens what you've learned. Review and go again — you've got this.",
      insight: INSIGHTS[2],
    };
  }

  let base: Encouragement;
  if (scorePercent === 100) {
    base = { emoji: "🌟", tone: "win", title: "Flawless!", body: "Every single answer correct. That's mastery." };
  } else if (scorePercent >= 90) {
    base = { emoji: "🏆", tone: "win", title: "Outstanding work", body: "You really know this material." };
  } else {
    base = { emoji: "🎉", tone: "win", title: "Lesson complete", body: "Another step forward. Showing up is what counts." };
  }

  let levelLine: string | undefined;
  if (progress && progress.total > 0) {
    const remaining = progress.total - progress.completed;
    const pct = Math.round((progress.completed / progress.total) * 100);
    const next = LEVELS[LEVELS.indexOf(level.toUpperCase()) + 1];
    if (remaining <= 0) {
      levelLine = `You've finished all of ${level.toUpperCase()}!${next ? ` ${next} is next.` : ""}`;
    } else if (remaining <= 3) {
      levelLine = `Only ${remaining} lesson${remaining > 1 ? "s" : ""} left to finish ${level.toUpperCase()}${next ? ` and reach ${next}` : ""}. You're almost there!`;
    } else if (pct >= 75) {
      levelLine = `You're ${pct}% of the way through ${level.toUpperCase()}. The end is in sight.`;
    } else if (pct >= 50) {
      levelLine = `More than halfway through ${level.toUpperCase()} (${pct}%). Great momentum.`;
    } else if (pct >= 25 && Math.floor((progress.before / progress.total) * 100) < 25) {
      levelLine = `You've passed the 25% mark of ${level.toUpperCase()}. The habit is forming.`;
    } else {
      levelLine = `${progress.completed} of ${progress.total} lessons done in ${level.toUpperCase()}.`;
    }
  }

  return { ...base, insight, levelLine };
}
