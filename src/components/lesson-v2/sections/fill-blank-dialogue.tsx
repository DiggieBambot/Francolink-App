"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Radio } from "lucide-react";
import { useSoundEngine } from "@/hooks/use-sound-engine";
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

// Some lessons use a different shape: each exchange IS a blank, with
//   { speaker: "sentence with ____", text: "<answer>", blank: true }
// (instead of inline "(1)" markers). Detect that and render a drag-and-drop fill.
//
// Generation sometimes mistags every exchange with blank:true even when the
// text already has inline "(N)" markers (the normal shape below). If any
// exchange contains a marker, this is NOT the whole-line shape — treating it as
// one would discard every sentence's real text (including the tutor's) and show
// nothing but an empty drop target on every line.
function isBlankPerExchange(section: FillBlankDialogueSection | FillBlankDialogueExtendedSection): boolean {
  const ex = section.exchanges;
  if (!Array.isArray(ex) || ex.length === 0) return false;
  if (!ex.every((e) => (e as { blank?: unknown }).blank === true)) return false;
  if (ex.some((e) => /\(\d+\)/.test((e as { text?: string }).text || ""))) return false;
  return true;
}

export function FillBlankDialogueSectionComp({ section, view, sectionIdx = 0, theme }: Props) {
  if (isBlankPerExchange(section)) {
    return <DragDropFill section={section} view={view} sectionIdx={sectionIdx} theme={theme} />;
  }
  const { play } = useSoundEngine();
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
  // Derived from the actual "(N)" markers in each line's text — not ex.blank,
  // which generation populates unreliably (missing, or a plain `true` instead
  // of the marker number). The markers are the same source of truth already
  // used to render each blank, so this is always consistent with what's shown.
  const orderedBlanks: number[] = [];
  for (const ex of section.exchanges) {
    for (const n of blankNumbers(ex.blank).concat(
      Array.from(String(ex.text || "").matchAll(/\((\d+)\)/g), (m) => parseInt(m[1], 10))
    )) {
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
    play("tap");
    setLocalAnswers((prev) => ({ ...prev, [next]: poolItem }));
  };

  /** Drop (or tap) a pool word directly onto a specific blank. */
  const placeAt = (num: number, poolItem: string) => {
    if (isTutorObserving) return;
    play("tap");
    setLocalAnswers((prev) => ({ ...prev, [num]: poolItem }));
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

  const completionPlayed = useRef(false);
  useEffect(() => {
    if (!allFilled || completionPlayed.current || isTutorObserving) return;
    completionPlayed.current = true;
    play(allCorrect ? "correct" : "incorrect");
  }, [allFilled, allCorrect, isTutorObserving, play]);

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
                            onDragOver={(e) => { if (!isTutorObserving) e.preventDefault(); }}
                            onDrop={(e) => {
                              if (isTutorObserving) return;
                              e.preventDefault();
                              const word = e.dataTransfer.getData("text/plain");
                              if (word) placeAt(num, word);
                            }}
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
              Answer pool {isTutorObserving ? "(read-only)" : "— drag onto a blank (or tap to fill the next one)"}
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
                  draggable={!disabled}
                  onDragStart={(e) => { if (!disabled) e.dataTransfer.setData("text/plain", a); }}
                  className={`inline-flex items-center gap-0.5 rounded-full border shadow-sm transition ${
                    disabled
                      ? "border-slate-200 bg-slate-100"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md cursor-grab active:cursor-grabbing"
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

type BlankEx = { speaker?: string; text?: string; translation?: string; avatar_seed?: string };

/** Drag-and-drop fill-in for the "blank per exchange" schema. Answers are hidden;
 *  the student drags (or taps) pool words into each sentence's blank. */
function DragDropFill({ section, view, sectionIdx = 0, theme }: Props) {
  const { play } = useSoundEngine();
  const room = useLessonRoom();
  const anchor = `s${sectionIdx}/fill_in_blank`;
  const isTutorObserving = room?.currentRole === "tutor";
  const [local, setLocal] = useState<Record<number, string | undefined>>({});
  const remote =
    (isTutorObserving ? (room?.studentAnswers[anchor]?.state as Record<number, string | undefined> | undefined) : undefined) || {};
  const filled = isTutorObserving ? remote : local;

  useEffect(() => {
    if (!room || room.currentRole !== "student") return;
    room.reportAnswer(anchor, local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const blanks = (section.exchanges as unknown as BlankEx[]) || [];
  const pool = section.answer_pool?.length ? section.answer_pool : blanks.map((b) => b.text || "");
  const used: Record<string, number> = {};
  for (const w of Object.values(filled)) if (typeof w === "string") used[w] = (used[w] || 0) + 1;
  const remaining = (w: string) => pool.filter((x) => x === w).length - (used[w] || 0);

  const place = (i: number, w: string) => { if (!isTutorObserving) { play("tap"); setLocal((p) => ({ ...p, [i]: w })); } };
  const clear = (i: number) => { if (!isTutorObserving) setLocal((p) => { const n = { ...p }; delete n[i]; return n; }); };
  const placeNext = (w: string) => { const i = blanks.findIndex((_, idx) => !filled[idx]); if (i >= 0) place(i, w); };
  const correctOf = (i: number) => filled[i] != null && normalize(String(filled[i])) === normalize(String(blanks[i]?.text || ""));
  const allFilled = blanks.length > 0 && blanks.every((_, i) => filled[i]);
  const allCorrect = allFilled && blanks.every((_, i) => correctOf(i));

  const completionPlayed = useRef(false);
  useEffect(() => {
    if (!allFilled || completionPlayed.current || isTutorObserving) return;
    completionPlayed.current = true;
    play(allCorrect ? "correct" : "incorrect");
  }, [allFilled, allCorrect, isTutorObserving, play]);

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
        <div className="mb-4 rounded-lg bg-gray-100 p-3 text-sm">
          <div className="text-[10px] font-semibold uppercase text-gray-500">Example</div>
          <div className="mt-1 italic">{section.example.tutor_line}</div>
          <div className="mt-1 text-gray-600">→ {section.example.student_line}</div>
        </div>
      ) : null}

      <div className="space-y-2.5">
        {blanks.map((b, i) => {
          const sentence = b.speaker || "";
          const [before, after = ""] = sentence.split(/_{2,}/);
          const speak = `${before} ${filled[i] || ""} ${after}`.replace(/_{2,}/g, " ");
          return (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-soft">
              <div className="flex items-start gap-2.5">
                <Avatar seed={b.avatar_seed || "S"} size={30} />
                <div className="flex-1 text-sm leading-7 text-gray-800">
                  {before}
                  {filled[i] ? (
                    <button
                      type="button"
                      onClick={() => clear(i)}
                      disabled={isTutorObserving}
                      className={`mx-1 inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold ${
                        correctOf(i) ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                      } ${isTutorObserving ? "cursor-default" : "hover:opacity-80"}`}
                    >
                      {filled[i]}
                    </button>
                  ) : (
                    <span
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const w = e.dataTransfer.getData("text/plain");
                        if (w) place(i, w);
                      }}
                      className="mx-1 inline-flex min-w-[72px] items-center justify-center rounded-md border-2 border-dashed border-primary-300 bg-primary-50/60 px-2 py-0.5 text-xs font-semibold text-primary-400"
                    >
                      déposez ici
                    </span>
                  )}
                  {after}
                  <span className="ml-1 inline-block align-middle">
                    <SpeakButton text={speak} size="sm" />
                  </span>
                  {b.translation ? (
                    <span className="ml-2 align-middle">
                      <RevealTranslation text={b.translation} size="sm" />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Draggable answer pool */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Answer pool {isTutorObserving ? "(read-only)" : "— drag a word into a blank (or tap)"}
          </div>
          {allFilled ? (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${allCorrect ? "text-emerald-700" : "text-rose-600"}`}>
              {allCorrect ? (<><Check className="h-3.5 w-3.5" /> All correct</>) : <>Some answers don&apos;t match</>}
            </span>
          ) : Object.keys(filled).length > 0 && !isTutorObserving ? (
            <button type="button" onClick={() => setLocal({})} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {pool.map((a, i) => {
            const disabled = remaining(a) <= 0 || isTutorObserving;
            return (
              <button
                key={i}
                type="button"
                draggable={!disabled}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", a)}
                onClick={() => !disabled && placeNext(a)}
                disabled={disabled}
                className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm shadow-sm transition ${
                  disabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "cursor-grab border-gray-200 bg-white text-gray-900 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <TutorNotes view={view} instruction={section.tutor_instruction}>
        <div className="text-xs">
          <span className="font-semibold uppercase">Answers: </span>
          {blanks.map((b, i) => (
            <span key={i}>{i > 0 ? " · " : ""}{i + 1}. {b.text}</span>
          ))}
        </div>
      </TutorNotes>
    </SectionCard>
  );
}
