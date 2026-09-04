"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Eye, EyeOff, Radio } from "lucide-react";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { RevealTranslation } from "../reveal-translation";
import { SectionCard } from "../section-card";
import { useLessonRoom } from "../lesson-room-context";
import type { LessonView, MatchingQASection } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: MatchingQASection;
  view: LessonView;
  theme?: LevelTheme;
  sectionIdx?: number;
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[‘’ʼʻ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

/** Deterministic shuffle so server and client render the same order — a
 *  Math.random() shuffle would cause a hydration mismatch. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Choice = { id: number; text: string };

export function MatchingQASectionComp({ section, view, theme, sectionIdx = 0 }: Props) {
  const speak = section.speak !== false;
  const { play } = useSoundEngine();
  const room = useLessonRoom();
  const anchor = `s${sectionIdx}/matching_qa`;
  const isTutorObserving = room?.currentRole === "tutor";

  const pairs = section.pairs;
  // The answer bank, shuffled — otherwise the drill is solvable by reading
  // straight down the list, which is no drill at all.
  const choices: Choice[] = pairs.map((p, id) => ({ id, text: p.answer }));
  const bankOrder = seededShuffle(choices, hashString(pairs.map((p) => p.answer).join("|")));

  const [localAssigned, setLocalAssigned] = useState<(number | null)[]>(() => pairs.map(() => null));
  const [selectedQ, setSelectedQ] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const remote = isTutorObserving
    ? (room?.studentAnswers[anchor]?.state as { assigned?: (number | null)[] } | undefined)
    : undefined;
  const assigned: (number | null)[] = isTutorObserving
    ? remote?.assigned ?? pairs.map(() => null)
    : localAssigned;
  const remoteUpdatedAt = isTutorObserving ? room?.studentAnswers[anchor]?.updatedAt : undefined;

  useEffect(() => {
    if (!room || room.currentRole !== "student") return;
    room.reportAnswer(anchor, { assigned: localAssigned });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAssigned]);

  const isRight = (qi: number) => {
    const id = assigned[qi];
    if (id === null || id === undefined) return false;
    return normalize(choices[id].text) === normalize(pairs[qi].answer);
  };

  const allPlaced = assigned.every((a) => a !== null && a !== undefined);
  const score = pairs.reduce((n, _p, i) => n + (isRight(i) ? 1 : 0), 0);

  const checkedOnce = useRef(false);
  useEffect(() => {
    if (!checked || checkedOnce.current || isTutorObserving) return;
    checkedOnce.current = true;
    play(score === pairs.length ? "correct" : "incorrect");
  }, [checked, score, pairs.length, isTutorObserving, play]);

  const assign = (choiceId: number) => {
    if (isTutorObserving) return;
    play("tap");
    setChecked(false);
    checkedOnce.current = false;
    setLocalAssigned((prev) => {
      const next = [...prev];
      // A choice lives in one slot only — clear it from anywhere else first.
      for (let i = 0; i < next.length; i++) if (next[i] === choiceId) next[i] = null;
      const target = selectedQ ?? next.findIndex((a) => a === null);
      if (target >= 0) next[target] = choiceId;
      return next;
    });
    setSelectedQ(null);
  };

  const clearSlot = (qi: number) => {
    if (isTutorObserving) return;
    play("tap");
    setChecked(false);
    checkedOnce.current = false;
    setLocalAssigned((prev) => {
      const next = [...prev];
      next[qi] = null;
      return next;
    });
  };

  const reset = () => {
    if (isTutorObserving) return;
    setLocalAssigned(pairs.map(() => null));
    setSelectedQ(null);
    setChecked(false);
    setRevealed(false);
    checkedOnce.current = false;
  };

  const accentText = theme?.accentText ?? "text-blue-700";
  const accentBg = theme?.accentBg ?? "bg-blue-600";

  const usedIds = new Set(assigned.filter((a): a is number => a !== null && a !== undefined));
  const bank = bankOrder.filter((c) => !usedIds.has(c.id));

  // A tutor prepping the lesson (not watching a live student) still gets the key.
  const showKey = view === "tutor" && !isTutorObserving;

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

      {showKey ? (
        <ul className="divide-y rounded-xl border">
          {pairs.map((p, i) => (
            <li key={i} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                  <span className="text-sm text-slate-900">{p.question}</span>
                  {speak ? <SpeakButton text={p.question} size="sm" /> : null}
                </div>
                {p.question_translation ? (
                  <div className="ml-7">
                    <RevealTranslation text={p.question_translation} />
                  </div>
                ) : null}
              </div>
              <div className="rounded bg-emerald-50 px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">A</span>
                  <span className="text-sm text-emerald-900">{p.answer}</span>
                  {speak ? <SpeakButton text={p.answer} size="sm" /> : null}
                </div>
                {p.answer_translation ? (
                  <div className="ml-6">
                    <RevealTranslation text={p.answer_translation} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {isTutorObserving ? (
            <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-0.5 text-[10px] font-semibold text-secondary-700">
              <Radio className="h-3 w-3 animate-pulse" />
              {remoteUpdatedAt ? "Student working" : "Awaiting student"}
            </div>
          ) : (
            <p className="mb-3 text-xs text-slate-500">
              Tap an answer below, then tap the question it belongs to — or tap a question first to
              pick its slot. Tap a filled slot to send the answer back.
            </p>
          )}

          <ul className="divide-y rounded-xl border">
            {pairs.map((p, i) => {
              const id = assigned[i];
              const filled = id !== null && id !== undefined;
              const right = checked && isRight(i);
              const wrong = checked && filled && !isRight(i);
              const isSelected = selectedQ === i;
              return (
                <li key={i} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                      <span className="text-sm text-slate-900">{p.question}</span>
                      {speak ? <SpeakButton text={p.question} size="sm" /> : null}
                    </div>
                    {p.question_translation ? (
                      <div className="ml-7">
                        <RevealTranslation text={p.question_translation} />
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={isTutorObserving}
                    onClick={() => (filled ? clearSlot(i) : setSelectedQ(isSelected ? null : i))}
                    className={`flex min-h-[2.5rem] items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${
                      right
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                        : wrong
                          ? "border-red-400 bg-red-50 text-red-800"
                          : isSelected
                            ? "border-blue-500 bg-blue-50 text-blue-900"
                            : filled
                              ? "border-slate-300 bg-white text-slate-900"
                              : "border-dashed border-slate-300 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <span>
                      {filled ? choices[id].text : isSelected ? "Choose an answer…" : "Tap to match"}
                    </span>
                    {checked && filled ? <span aria-hidden>{right ? "✓" : "✗"}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {bank.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {bank.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={isTutorObserving}
                  onClick={() => assign(c.id)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:border-blue-400 disabled:opacity-60"
                >
                  {c.text}
                </button>
              ))}
            </div>
          ) : null}

          {!isTutorObserving ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setChecked(true)}
                disabled={!allPlaced}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${accentBg}`}
              >
                <Check className="h-4 w-4" /> Check answers
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {revealed ? "Hide answers" : "Show answers"}
              </button>
              {checked ? (
                <span className={`text-sm font-semibold ${accentText}`}>
                  {score}/{pairs.length} correct
                </span>
              ) : null}
            </div>
          ) : null}

          {revealed && !isTutorObserving ? (
            <ul className="mt-3 space-y-1 rounded-xl border bg-emerald-50/60 p-3">
              {pairs.map((p, i) => (
                <li key={i} className="text-sm text-emerald-900">
                  <span className="font-semibold">Q{i + 1}</span> {p.question} → {p.answer}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
