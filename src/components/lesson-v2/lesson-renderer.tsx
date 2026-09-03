"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, BookOpenCheck, Clock, Target, Lightbulb } from "lucide-react";
import type { Lesson, LessonView, Section } from "@/lib/lessons/types";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { VocabularySection } from "./sections/vocabulary";
import { FillBlankDialogueSectionComp } from "./sections/fill-blank-dialogue";
import { DialogueReadAloudSectionComp } from "./sections/dialogue-read-aloud";
import { ReadingComprehensionSectionComp } from "./sections/reading-comprehension";
import { MatchingQASectionComp } from "./sections/matching-qa";
import { WordOrderSectionComp } from "./sections/word-order";
import { ImageQuestionPromptsSectionComp } from "./sections/image-question-prompts";
import { FreeResponseSectionComp } from "./sections/free-response";
import { GrammarExplainerSectionComp } from "./sections/grammar-explainer";
import { GenericActivitySection } from "./sections/generic-activity";
import { StepperSidebar } from "./stepper-sidebar";
import { LessonLanguageProvider } from "./lesson-language-context";
import { SoundToggle } from "@/components/ui/sound-toggle";

interface LessonRendererProps {
  lesson: Lesson;
  initialView?: LessonView;
  /** When set, hides the view toggle and locks the view (used in live session rooms). */
  lockedView?: LessonView;
}

function renderSection(s: Section, view: LessonView, sectionIdx: number, theme: ReturnType<typeof getLevelTheme>) {
  const kind = s.kind as string;
  switch (kind) {
    case "warmup_vocabulary":
    case "vocabulary_with_examples":
      return <VocabularySection section={s as never} view={view} sectionIdx={sectionIdx} theme={theme} />;
    case "fill_in_blank_dialogue":
    case "fill_in_blank_dialogue_extended":
      return <FillBlankDialogueSectionComp section={s as never} view={view} sectionIdx={sectionIdx} theme={theme} />;
    case "dialogue_read_aloud":
      return <DialogueReadAloudSectionComp section={s as never} view={view} sectionIdx={sectionIdx} theme={theme} />;
    case "reading_comprehension":
      return <ReadingComprehensionSectionComp section={s as never} view={view} sectionIdx={sectionIdx} theme={theme} />;
    case "grammar_explainer":
      return <GrammarExplainerSectionComp section={s as never} view={view} sectionIdx={sectionIdx} theme={theme} />;
    case "matching_qa":
      return <MatchingQASectionComp section={s as never} view={view} theme={theme} sectionIdx={sectionIdx} />;
    case "word_order":
      return <WordOrderSectionComp section={s as never} view={view} theme={theme} sectionIdx={sectionIdx} />;
    case "image_question_prompts":
      return <ImageQuestionPromptsSectionComp section={s as never} view={view} theme={theme} />;
    // free_response, plus discussion + writing which share its shape
    case "free_response":
    case "discussion":
    case "writing":
      return <FreeResponseSectionComp section={s as never} view={view} theme={theme} />;
    default:
      // Any other kind (debate, role_play, research, case_study, presentation,
      // conversation, find_the_error, etc.) → flexible generic activity renderer.
      return <GenericActivitySection section={s as never} view={view} theme={theme} />;
  }
}

export function LessonRenderer({ lesson, initialView = "tutor", lockedView }: LessonRendererProps) {
  const [view, setView] = useState<LessonView>(lockedView || initialView);
  const totalSteps = lesson.sections.length;
  const showToggle = !lockedView;
  const theme = getLevelTheme(lesson.level);

  return (
    <LessonLanguageProvider language={lesson.language || "fr"}>
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero */}
      <header className="relative">
        <div className="relative h-52 w-full overflow-hidden bg-slate-200 sm:h-72">
          {lesson.hero_image_url ? (
            <Image
              src={lesson.hero_image_url}
              alt={lesson.title}
              fill
              sizes="100vw"
              priority
              // Same as the library covers: `priority` made it eager but no
              // fetchpriority hint was emitted, leaving ~1s of load delay on
              // an above-the-fold LCP image that is already in the HTML.
              fetchPriority="high"
              className="object-cover"
            />
          ) : null}
          {/* Cleaner gradient: softer at the top, level-tinted at the bottom */}
          <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} via-slate-900/30 to-slate-900/10`} />

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:pb-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                {/* Tags above the title — more magazine-like */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {lesson.topic_tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  {lesson.title}
                </h1>
                {lesson.title_translation ? (
                  <p className="mt-1 text-sm text-white/80 sm:text-base">{lesson.title_translation}</p>
                ) : null}
              </div>

              {/* Meta pills on the right (wraps below title on mobile) */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(lesson as { country?: { flag?: string; name?: string } }).country?.flag ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow">
                    <span className="text-sm leading-none">{(lesson as { country?: { flag?: string } }).country!.flag}</span>
                    {(lesson as { country?: { name?: string } }).country?.name}
                  </span>
                ) : null}
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow ${theme.pill}`}>
                  {lesson.level}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase text-white backdrop-blur">
                  {lesson.language}
                </span>
                {lesson.duration_minutes ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes} min
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {/* Level-colored accent strip ties the hero to the content below */}
        <div className={`h-1 ${theme.accentBg}`} />
      </header>

      {/* View toggle (hidden in locked / session-room mode) */}
      {showToggle ? (
        <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2.5">
            <div className="inline-flex rounded-full border bg-slate-50 p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setView("student")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                  view === "student"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Eye className="h-4 w-4" /> Student
              </button>
              <button
                type="button"
                onClick={() => setView("tutor")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition ${
                  view === "tutor"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BookOpenCheck className="h-4 w-4" /> Tutor
              </button>
            </div>
            <div className="flex items-center gap-2">
              <SoundToggle size="sm" />
              <span className="text-xs text-slate-500">{totalSteps} steps</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Body: stepper + content */}
      <div className="mx-auto grid max-w-5xl gap-6 px-6 pt-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <StepperSidebar sections={lesson.sections} theme={theme} />
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          {/* What you'll learn — visible in BOTH views, labelled differently */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Target className="h-3.5 w-3.5" />
                {view === "tutor" ? "Objectives" : "What you'll learn"}
              </h3>
              <ul className="space-y-2 text-sm">
                {lesson.objectives.map((o, i) => (
                  <li key={i}>
                    <div className="text-slate-900">{o.student_label}</div>
                    {view === "tutor" ? (
                      <div className="text-xs text-slate-500">
                        {o.skill} · {o.cefr_can_do}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips card: shows learning_tips to student, teaching_tips + common mistakes to tutor */}
            {view === "student" ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-800">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Tips for this lesson
                </h3>
                {(lesson.learning_tips?.length ?? 0) > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-blue-950">
                    {lesson.learning_tips!.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-blue-900/70 italic">
                    Take your time, repeat each word aloud after your tutor, and
                    don&apos;t be afraid to ask for help.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Teaching tips
                </h3>
                <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-emerald-950">
                  {(lesson.tutor_overview?.teaching_tips || []).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Common mistakes
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-emerald-950">
                  {(lesson.tutor_overview?.common_mistakes || []).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {lesson.sections.map((s, i) => (
            <section key={i} id={`section-${i}`} data-section-idx={i} className="scroll-mt-20">
              <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
                Step {i + 1} of {totalSteps}
              </div>
              {renderSection(s, view, i, theme)}
            </section>
          ))}
        </main>
      </div>
    </div>
    </LessonLanguageProvider>
  );
}
