"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { Highlightable } from "../highlightable";
import { RevealTranslation } from "../reveal-translation";
import { useLessonRoom } from "../lesson-room-context";
import { SectionCard } from "../section-card";
import { VocabFocusOverlay } from "../vocab-focus-overlay";
import type {
  LessonView,
  VocabExamplesSection,
  WarmupVocabSection,
} from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: WarmupVocabSection | VocabExamplesSection;
  view: LessonView;
  sectionIdx?: number;
  theme?: LevelTheme;
}

export function VocabularySection({ section, view, sectionIdx = 0, theme }: Props) {
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const withExamples = section.kind === "vocabulary_with_examples";
  // In a live room, clicking a card must NOT open the zoom modal — it would
  // steal clicks meant to highlight the word. Zoom stays for self-study only.
  const inRoom = !!useLessonRoom();
  return (
    <>
    <SectionCard theme={theme}>
      <SectionHeader
        view={view}
        number={section.number}
        kind={section.kind}
        title={section.title}
        student_instruction={section.student_instruction}
        theme={theme}
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.items.map((item, i) => (
          <li
            key={i}
            onClick={inRoom ? undefined : () => setFocusIdx(i)}
            className={`group relative flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
              inRoom ? "" : "cursor-pointer"
            }`}
          >
            <span
              className={`pointer-events-none absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white opacity-0 transition group-hover:opacity-100 ${
                inRoom ? "hidden" : ""
              }`}
              aria-hidden
              title="Tap to enlarge"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.term}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  —
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <div className="flex items-start gap-2">
                  <Highlightable
                    id={`s${sectionIdx}/v${i}/term`}
                    text={item.term}
                    sectionIdx={sectionIdx}
                    className="text-lg font-bold text-slate-900"
                  >
                    {item.term}
                  </Highlightable>
                  {item.gender ? (
                    <span className="mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      {item.gender}
                    </span>
                  ) : null}
                  <SpeakButton text={item.tts_text || item.term} size="md" className={`ml-auto ${theme?.softBg ?? "bg-emerald-50"} hover:opacity-90`} />
                </div>
                {item.pronunciation ? (
                  <div className="mt-0.5 text-xs text-slate-500">{item.pronunciation}</div>
                ) : null}
                {item.part_of_speech ? (
                  <div className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                    {item.part_of_speech}
                  </div>
                ) : null}
                {item.translation ? (
                  <div className="mt-1">
                    <RevealTranslation text={item.translation} size="sm" />
                  </div>
                ) : null}
              </div>
              {withExamples && item.example ? (
                <div className="mt-3 rounded-lg bg-slate-50 p-2 text-sm">
                  <div className="flex items-start gap-1">
                    <Highlightable
                      id={`s${sectionIdx}/v${i}/example`}
                      text={item.example}
                      sectionIdx={sectionIdx}
                      className="flex-1 text-slate-800"
                    >
                      {item.example}
                    </Highlightable>
                    <SpeakButton text={item.example} size="sm" />
                  </div>
                  {item.example_translation ? (
                    <div className="mt-0.5">
                      <RevealTranslation text={item.example_translation} />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {item.note ? (
                <div className="mt-2 text-xs italic text-slate-400">{item.note}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <TutorNotes view={view} instruction={section.tutor_instruction}>
        <p className="text-xs text-emerald-900">
          Drill pronunciation chorally then individually. Tap any card&apos;s
          speaker icon to model the word.
        </p>
      </TutorNotes>

    </SectionCard>

    {/* Portal to document.body so SectionCard's overflow:hidden + transition
        stacking context cannot clip the fixed overlay */}
    {focusIdx != null && typeof document !== "undefined" && createPortal(
      <VocabFocusOverlay
        item={section.items[focusIdx]}
        onClose={() => setFocusIdx(null)}
        theme={theme}
      />,
      document.body
    )}
    </>
  );
}
