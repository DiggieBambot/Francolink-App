"use client";

import { Fragment, useEffect, useState } from "react";
import { Check, RotateCcw, Radio } from "lucide-react";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { Avatar } from "../avatar";
import { Highlightable } from "../highlightable";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import { useLessonRoom } from "../lesson-room-context";
import type {
  FillBlankDialogueExtendedSection,
  FillBlankDialogueSection,
  LessonView,
} from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: FillBlankDialogueSection | FillBlankDialogueExtendedSection;
  view: LessonView;
  sectionIdx?: number;
  theme?: LevelTheme;
}

type Answers = Record<number, string | undefined>;

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[‘’ʼʻ]/g, "'").replace(/[.,!?;:]/g, "").replace(/\s+/g, " ");
}

function blankNumbers(b: number | number[] | undefined): number[] {
  if (b == null) return [];
  return Array.isArray(b) ? b : [b];
}

/** Split a text like "J'ai (1) un livre et (2) des chaussures."
 *  into ordered segments of plain text or blank markers. */
function tokenizeBlanks(text: string): Array<{ type: "text" | "blank"; value: string; num?: number }> {
  const parts: Array<{ type: "text" | "blank"; value: string; num?: number }> = [];
  const regex = /\((\d+)\)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push({ type: "text", value: text.slice(lastIdx, m.index) });
    parts.push({ type: "blank", value: m[0], num: parseInt(m[1], 10) });
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push({ type: "text", value: text.slice(lastIdx) });
  return parts;
}

function isAnswerCorrect(
  num: number,
  ans: string,
  validByBlank: Record<string, string[]> | undefined
): boolean {
  if (!validByBlank) return false;
  const valid = validByBlank[String(num)] || validByBlank[num as unknown as string];
  if (!Array.isArray(valid) || valid.length === 0) return false;
  return valid.some((v) => normalize(v) === normalize(ans));
}

export function FillBlankDialogueSectionComp({ section, view, sectionIdx = 0, theme }: Props) {
  const ext = section.kind === "fill_in_blank_dialogue_extended" ? section : null;
  const room = useLessonRoom();
  const anchor = `s${sectionIdx}/fill_in_blank`;
  const isTutorObserving = room?.currentRole === "tutor";

  const [localAnswers, setLocalAnswers] = useState<Answers>({});

  // Tutor watches student via the room's studentAnswers map.
  const remoteAnswers = (isTutorObserving
    ? (room?.studentAnswers[anchor]?.state as Answers | undefined)
    : undefined) || {};
  const answers = isTutorObserving ? remoteAnswers : localAnswers;
  const remoteUpdatedAt = isTutorObserving ? room?.studentAnswers[anchor]?.updatedAt : undefined;

  // All blank numbers used in this section, in order of first appearance.
  const orderedBlanks: number[] = [];
  for (const ex of section.exchanges) {
    for (const n of blankNumbers(ex.blank)) {
      if (!orderedBlanks.includes(n)) orderedBlanks.push(n);
    }
  }

  const usedAnswerCounts: Record<string, number> = {};
  for (const a of Object.values(answers)) {
    if (typeof a === "string") usedAnswerCounts[a] = (usedAnswerCounts[a] || 0) + 1;
  }

  // Pool counts: how many times each pool string has been placed so far.
  const remainingFromPool = (poolItem: string): number => {
    const poolCount = section.answer_pool.filter((x) => x === poolItem).length;
    return poolCount - (usedAnswerCounts[poolItem] || 0);
  };

  // Broadcast local changes.
  useEffect(() => {
    if (!room || room.currentRole !== "student") return;
    room.reportAnswer(anchor, localAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAnswers]);

  const fillNextBlank = (poolItem: string) => {
    if (isTutorObserving) return;
    const next = orderedBlanks.find((n) => !answers[n]);
    if (next == null) return;
    setLocalAnswers((prev) => ({ ...prev, [next]: poolItem }));
  };

  const clearBlank = (num: number) => {
    if (isTutorObserving) return;
    setLocalAnswers((prev) => {
      const next = { ...prev };
      delete next[num];
      return next;
    });
  };

  const reset = () => {
    if (isTutorObserving) return;
    setLocalAnswers({});
  };

  const accentText = theme?.accentText ?? "text-blue-700";

  const allFilled = orderedBlanks.length > 0 && orderedBlanks.every((n) => !!answers[n]);
  const allCorrect =
    allFilled &&
    orderedBlanks.every((n) => isAnswerCorrect(n, answers[n]!, section.valid_answers_by_blank));

  return (
    <SectionCard theme={theme}>
      <SectionHeader
        view={view}
        number={section.number}
        kind={section.kind}
        title={section.title}
        student_instruction={section.student_instruction}
        theme={theme}
      />

      {section.example ? (
        <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm">
          <div className="text-[10px] font-semibold uppercase text-slate-500">Example</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="italic">{section.example.tutor_line}</span>
            <SpeakButton text={section.example.tutor_line} size="sm" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-slate-600">
            <span>→ {section.example.student_line}</span>
            <SpeakButton text={section.example.student_line} size="sm" />
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        {ext && (ext.student_role || ext.tutor_role) ? (
          <div className="text-xs text-slate-600">
            <strong>You:</strong> {ext.student_role}
            {ext.tutor_role ? <> · <strong>Tutor:</strong> {ext.tutor_role}</> : null}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {isTutorObserving ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Radio className="h-3 w-3 animate-pulse" />
              {remoteUpdatedAt ? "Student working" : "Awaiting student"}
            </span>
          ) : null}
          {!isTutorObserving && Object.keys(answers).length > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {section.exchanges.map((ex, i) => {
          const isTutor = ex.speaker_role === "tutor";
          const parts = tokenizeBlanks(ex.text);
          return (
            <div
              key={i}
              className={`flex items-start gap-2 ${isTutor ? "" : "flex-row-reverse"}`}
            >
              <Avatar seed={ex.avatar_seed || ex.speaker} size={36} />
              <div className={`max-w-[78%] ${isTutor ? "items-start" : "items-end"} flex flex-col`}>
                <div className="mb-0.5 text-[11px] font-semibold text-slate-500">{ex.speaker}</div>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm ${
                    isTutor
                      ? "rounded-tl-sm bg-amber-100 text-amber-950"
                      : "rounded-tr-sm bg-emerald-100 text-emerald-950"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <Highlightable
                      id={`s${sectionIdx}/e${i}/text`}
                      text={ex.text}
                      sectionIdx={sectionIdx}
                      className="flex-1"
                    >
                      {parts.map((p, idx) => {
                        if (p.type === "text") return <Fragment key={idx}>{p.value}</Fragment>;
                        const num = p.num!;
                        const ans = answers[num];
                        if (ans) {
                          const correct = isAnswerCorrect(num, ans, section.valid_answers_by_blank);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => clearBlank(num)}
                              disabled={isTutorObserving}
                              className={`mx-0.5 inline-flex items-center rounded px-1.5 text-xs font-semibold transition ${
                                correct
                                  ? "bg-emerald-200 text-emerald-900"
                                  : "bg-rose-200 text-rose-900"
                              } ${isTutorObserving ? "cursor-default" : "hover:opacity-80"}`}
                            >
                              {ans}
                            </button>
                          );
                        }
                        return (
                          <span
                            key={idx}
                            className="mx-0.5 inline-flex items-center rounded border border-dashed border-rose-300 bg-rose-50/60 px-1.5 py-0.5 text-xs font-bold text-rose-700"
                            title={`Blank ${num}`}
                          >
                            ({num})
                          </span>
                        );
                      })}
                    </Highlightable>
                    <SpeakButton text={ex.text.replace(/\(\d+\)/g, "")} size="sm" />
                  </div>
                  {ex.translation ? (
                    <div className="mt-1 border-t border-black/5 pt-1">
                      <RevealTranslation text={ex.translation} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {section.answer_pool?.length ? (
        <div className="mt-5 rounded-xl border bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Answer pool {isTutorObserving ? "(read-only)" : "— tap to fill the next blank"}
            </div>
            {allFilled ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  allCorrect ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {allCorrect ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> All correct
                  </>
                ) : (
                  <>Some answers don&apos;t match</>
                )}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {section.answer_pool.map((a, i) => {
              const remaining = remainingFromPool(a);
              const disabled = remaining <= 0 || isTutorObserving;
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 rounded-full border shadow-sm transition ${
                    disabled
                      ? "border-slate-200 bg-slate-100"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => fillNextBlank(a)}
                    disabled={disabled}
                    className={`rounded-full pl-3 pr-1 py-1 text-sm ${
                      disabled ? "text-slate-400 cursor-not-allowed" : "text-slate-900"
                    }`}
                  >
                    {a}
                  </button>
                  <SpeakButton text={a} size="sm" />
                </span>
              );
            })}
          </div>
          {!isTutorObserving ? (
            <div className={`mt-2 text-[11px] ${accentText}`}>
              Next empty blank: {orderedBlanks.find((n) => !answers[n]) ?? "—"}
            </div>
          ) : null}
        </div>
      ) : null}

      <TutorNotes view={view} instruction={section.tutor_instruction}>
        {section.valid_answers_by_blank ? (
          <div>
            <div className="text-xs font-semibold uppercase">Valid answers</div>
            <ul className="mt-1 space-y-0.5 text-xs">
              {Object.entries(section.valid_answers_by_blank).map(([k, v]) => (
                <li key={k}>
                  ({k}) → {Array.isArray(v) ? v.join(", ") : String(v)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </TutorNotes>
    </SectionCard>
  );
}
