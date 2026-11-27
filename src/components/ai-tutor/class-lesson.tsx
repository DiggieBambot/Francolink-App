"use client";

// The lesson on the student's screen during a class with Professor Léon.
//
// It is the same material a human tutor teaches from in the live lesson room
// (tutor_lessons, rendered by the lesson-v2 section components in student
// view), shown one step at a time. Léon and the screen stay on the same step:
// when he moves on, the screen follows; when the student taps a step or Next,
// he follows. Answers the student gives in the interactive exercises are
// collected here so they can be sent to Léon with the next turn.

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Languages, Loader2, Target } from "lucide-react";
import type { Lesson } from "@/lib/lessons/types";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { renderSection } from "@/components/lesson-v2/lesson-renderer";
import { LessonLanguageProvider } from "@/components/lesson-v2/lesson-language-context";
import {
  LessonRoomProvider,
  type LessonRoomContextValue,
} from "@/components/lesson-v2/lesson-room-context";

/** Section kinds with an on-screen exercise the student can answer. */
const EXERCISE_KINDS = new Set([
  "fill_in_blank_dialogue",
  "fill_in_blank_dialogue_extended",
  "matching_qa",
  "word_order",
]);

const noop = () => {};

const lessonCache = new Map<string, Lesson>();

/** Hand the component a lesson it would otherwise fetch (dev preview). */
export function primeLessonCache(id: string, lesson: Lesson) {
  lessonCache.set(id, lesson);
}

export function ClassLesson({
  lessonId,
  sectionIndex,
  answersRef,
  onStep,
  onCheck,
  busy,
  accent,
}: {
  lessonId: string;
  /** The step Léon is teaching (0-based); past the end once the lesson is done. */
  sectionIndex: number;
  /** Filled in as the student answers exercises, keyed by exercise anchor. */
  answersRef: React.MutableRefObject<Record<string, unknown>>;
  /** The student tapped a step, Back or Next. */
  onStep: (index: number) => void;
  /** The student asked Léon to check their answers on this step. */
  onCheck: () => void;
  /** Léon is replying: taps wait. */
  busy: boolean;
  /** Léon's colour for the current language. */
  accent: string;
}) {
  // Bumped when a fetch lands in the cache; the lesson itself is read from it.
  const [, setLoaded] = useState(0);
  const [failedId, setFailedId] = useState<string | null>(null);
  const lesson = lessonCache.get(lessonId) ?? null;
  const failed = failedId === lessonId;
  const [showTranslations, setShowTranslations] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    if (lessonCache.has(lessonId)) return;
    let cancelled = false;
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!data?.lesson?.sections) throw new Error("no sections");
        lessonCache.set(lessonId, data.lesson as Lesson);
        if (!cancelled) setLoaded((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) setFailedId(lessonId);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Answers belong to one lesson.
  useEffect(() => {
    answersRef.current = {};
  }, [lessonId, answersRef]);

  const total = lesson?.sections.length ?? 0;

  // A new step starts at its top, wherever the student had scrolled to.
  const topRef = useRef<HTMLDivElement>(null);
  const shownStep = useRef(sectionIndex);
  useEffect(() => {
    if (shownStep.current === sectionIndex) return;
    shownStep.current = sectionIndex;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionIndex]);
  const finished = total > 0 && sectionIndex >= total;
  const step = Math.min(Math.max(0, sectionIndex), Math.max(0, total - 1));

  // What the lesson components expect from a live room, minus everything that
  // only matters with a human on the other side.
  const room = useMemo<LessonRoomContextValue>(
    () => ({
      sessionId: `ai-${lessonId}`,
      currentUserId: "student",
      currentRole: "student",
      canHighlight: false,
      highlights: new Map(),
      toggleHighlight: noop,
      presence: [],
      broadcastSpeak: noop,
      incomingSpeak: null,
      // Translations are the student's own toggle here, not the tutor's.
      revealedTranslations: { has: () => showTranslations } as unknown as Set<string>,
      toggleTranslation: noop,
      studentAnswers: {},
      answersByStudent: {},
      learners: [],
      viewedStudentId: null,
      setViewedStudentId: noop,
      reportAnswer: (anchor: string, state: unknown) => {
        answersRef.current = { ...answersRef.current, [anchor]: state };
      },
      currentSectionIdx: null,
      setCurrentSectionIdx: noop,
      incomingScroll: null,
      broadcastScroll: noop,
      chatMessages: [],
      sendChat: noop,
      incomingLessonChange: null,
      broadcastLessonChange: noop,
      openLessonPicker: noop,
    }),
    [lessonId, answersRef, showTranslations]
  );

  if (failed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        The lesson material couldn&apos;t load. Professor Léon can still teach it. Just keep talking.
      </div>
    );
  }
  if (!lesson) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const theme = getLevelTheme(lesson.level);
  const section = lesson.sections[step];
  const isExercise = section && EXERCISE_KINDS.has(section.kind as string);

  return (
    <LessonLanguageProvider language={lesson.language || "fr"}>
      <LessonRoomProvider value={room}>
        <div ref={topRef} className="flex scroll-mt-2 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Lesson header: title, steps, translations */}
          <div className="border-b border-gray-100 px-4 pt-3 pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Today&apos;s lesson · {lesson.level}
                </p>
                <h2 className="truncate text-base font-bold text-gray-900">{lesson.title}</h2>
                {lesson.title_translation && (
                  <p className="truncate text-xs text-gray-500">{lesson.title_translation}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {lesson.objectives?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowGoals((v) => !v)}
                    className={`rounded-lg p-1.5 ${showGoals ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                    aria-label="What you'll learn"
                    title="What you'll learn"
                  >
                    <Target className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTranslations((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                    showTranslations ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                  aria-pressed={showTranslations}
                >
                  <Languages className="h-3.5 w-3.5" /> Translations
                </button>
              </div>
            </div>

            {showGoals && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                {lesson.objectives.map((o, i) => (
                  <li key={i}>{o.student_label}</li>
                ))}
              </ul>
            )}

            {/* Steps: done, now, next */}
            <div className="mt-2 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Lesson steps">
              {lesson.sections.map((s, i) => {
                const done = finished || i < step;
                const now = !finished && i === step;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={now}
                    disabled={busy || now}
                    onClick={() => onStep(i)}
                    title={s.title || `Step ${i + 1}`}
                    className={`flex h-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold transition-colors disabled:cursor-default ${
                      now ? "text-white" : done ? "bg-gray-100 text-gray-600" : "border border-gray-200 text-gray-400 hover:border-gray-400"
                    }`}
                    style={now ? { background: accent } : undefined}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                    {now && s.title ? <span className="max-w-[10rem] truncate font-medium">{s.title}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* The step itself, exactly as in the live lesson room */}
          <div className="px-3 py-3 sm:px-4">
            {finished ? (
              <div className="py-8 text-center">
                <p className="text-2xl">🎉</p>
                <p className="mt-2 font-semibold text-gray-900">Lesson complete</p>
                <p className="mt-1 text-sm text-gray-500">
                  Professor Léon is wrapping up. Tap any step to go back over it.
                </p>
              </div>
            ) : section ? (
              <div key={`${lessonId}-${step}`}>{renderSection(section, "student", step, theme)}</div>
            ) : null}
          </div>

          {/* Step controls */}
          {!finished && (
            <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-b-2xl border-t border-gray-100 bg-white/95 px-3 py-2 backdrop-blur">
              <button
                type="button"
                onClick={() => onStep(step - 1)}
                disabled={busy || step === 0}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="hidden text-xs text-gray-400 sm:inline">
                Step {step + 1} of {total}
              </span>
              <div className="flex items-center gap-2">
                {isExercise && (
                  <button
                    type="button"
                    onClick={onCheck}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:border-gray-400 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Check<span className="hidden sm:inline">my answers</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onStep(step + 1)}
                  disabled={busy || step >= total - 1}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: accent }}
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </LessonRoomProvider>
    </LessonLanguageProvider>
  );
}
