"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Eye, EyeOff, Radio } from "lucide-react";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { SpeakButton } from "../speak-button";
import { SectionHeader } from "../section-header";
import { TutorNotes } from "../tutor-notes";
import { SectionCard } from "../section-card";
import { useLessonRoom } from "../lesson-room-context";
import type { LessonView, WordOrderSection, WordOrderItem } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface Props {
  section: WordOrderSection;
  view: LessonView;
  theme?: LevelTheme;
  sectionIdx?: number;
}

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    // smart quotes → straight apostrophe
    .replace(/[‘’ʼʻ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

/** Token multiset equality after normalization — used to validate the
 *  scrambled pool actually contains the words needed for `correct`. */
function tokensMatch(a: string, b: string): boolean {
  const tokenize = (s: string) => normalize(s).split(/\s+/).filter(Boolean).sort();
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length !== tb.length) return false;
  return ta.every((tok, i) => tok === tb[i]);
}

interface BuilderProps {
  item: WordOrderItem;
  idx: number;
  view: LessonView;
  theme?: LevelTheme;
  sectionIdx: number;
}

type Token = { id: number; text: string };

function WordOrderBuilder({ item, idx, view, theme, sectionIdx }: BuilderProps) {
  const { play } = useSoundEngine();
  const room = useLessonRoom();
  const anchor = `s${sectionIdx}/i${idx}/word_order`;
  // In a live room the tutor watches the student's state read-only.
  const isTutorObserving = room?.currentRole === "tutor";

  // We assign a stable id to each scrambled token so duplicate words still
  // round-trip cleanly between pool ↔ built.
  const initialTokens: Token[] = item.scrambled
    .split(/\s+/)
    .filter(Boolean)
    .map((text, id) => ({ id, text }));

  const [localPool, setLocalPool] = useState<Token[]>(initialTokens);
  const [localBuilt, setLocalBuilt] = useState<Token[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Tutor pulls the student's state from the room. Falls back to fresh
  // initialTokens (untouched pool) until the student broadcasts a change.
  const remote =
    isTutorObserving && room?.studentAnswers[anchor]?.state as
      | { pool?: Token[]; built?: Token[] }
      | undefined;
  const pool = isTutorObserving ? remote?.pool ?? initialTokens : localPool;
  const built = isTutorObserving ? remote?.built ?? [] : localBuilt;
  const remoteUpdatedAt = isTutorObserving ? room?.studentAnswers[anchor]?.updatedAt : undefined;

  const builtPhrase = built.map((t) => t.text).join(" ");
  const correctPhrase = item.correct?.trim() || "";
  const isComplete = pool.length === 0 && built.length > 0;
  const isCorrect =
    isComplete && !!correctPhrase && normalize(builtPhrase) === normalize(correctPhrase);

  const completionPlayed = useRef(false);
  useEffect(() => {
    if (!isComplete || completionPlayed.current || isTutorObserving) return;
    completionPlayed.current = true;
    play(isCorrect ? "correct" : "incorrect");
  }, [isComplete, isCorrect, isTutorObserving, play]);

  // Quality check: scrambled must contain exactly the same tokens as correct.
  // If not, this exercise was generated badly and is unsolvable.
  const tokensOk = !correctPhrase || tokensMatch(item.scrambled, correctPhrase);

  // Whenever the student updates their state, broadcast it.
  useEffect(() => {
    if (!room || room.currentRole !== "student") return;
    room.reportAnswer(anchor, { pool: localPool, built: localBuilt });
    // We want this to fire on every local change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPool, localBuilt]);

  const moveToBuilt = (t: Token) => {
    if (isTutorObserving) return;
    play("tap");
    setLocalPool((p) => p.filter((x) => x.id !== t.id));
    setLocalBuilt((b) => [...b, t]);
  };
  const moveToPool = (t: Token) => {
    if (isTutorObserving) return;
    play("tap");
    setLocalBuilt((b) => b.filter((x) => x.id !== t.id));
    setLocalPool((p) => [...p, t]);
  };
  const reset = () => {
    if (isTutorObserving) return;
    setLocalPool(initialTokens);
    setLocalBuilt([]);
    setRevealed(false);
  };

  const accentText = theme?.accentText ?? "text-blue-700";
  const accentBg = theme?.accentBg ?? "bg-blue-600";

  return (
    <li className="rounded-xl border bg-slate-50/50 p-4">
      {!tokensOk && view === "tutor" ? (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Conversion warning:</strong> the scrambled pool doesn&apos;t contain the same words
          as the correct sentence — student cannot complete this. Edit the source doc or re-run the
          converter.
        </div>
      ) : null}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`text-xs font-semibold uppercase tracking-wide ${accentText}`}>
            Sentence {idx + 1}
          </div>
          {isTutorObserving ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Radio className="h-3 w-3 animate-pulse" />
              {remoteUpdatedAt ? "Student working" : "Awaiting student"}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isTutorObserving && built.length > 0 ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          ) : null}
          {view === "tutor" && correctPhrase ? (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
            >
              {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {revealed ? "Hide" : "Reveal"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Answer area — tap built words to send back to pool */}
      <div
        className={`min-h-[3rem] rounded-lg border-2 border-dashed p-2 transition-colors ${
          isCorrect
            ? "border-emerald-300 bg-emerald-50"
            : isComplete
              ? "border-rose-300 bg-rose-50"
              : "border-slate-200 bg-white"
        }`}
      >
        {built.length === 0 ? (
          <div className="px-1 py-1 text-xs italic text-slate-400">
            Tap the words below to build the sentence.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {built.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => moveToPool(t)}
                className="inline-flex items-center rounded-md border bg-white px-2 py-1 text-sm shadow-sm hover:bg-slate-100"
              >
                {t.text}
              </button>
            ))}
            {isComplete ? (
              <SpeakButton text={builtPhrase} size="sm" className="ml-1" />
            ) : null}
          </div>
        )}
      </div>

      {/* Pool — tap scrambled words to append to answer */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {pool.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => moveToBuilt(t)}
            className={`inline-flex items-center rounded-md border bg-white px-2 py-1 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            {t.text}
          </button>
        ))}
        {pool.length === 0 && !isCorrect && correctPhrase ? (
          <span className="text-xs italic text-rose-600">Not quite — tap a word to move it back.</span>
        ) : null}
        {isCorrect ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Nice!
          </span>
        ) : null}
      </div>

      {/* Revealed correct answer (tutor only) */}
      {view === "tutor" && revealed && correctPhrase ? (
        <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="text-xs font-semibold uppercase tracking-wide">Correct:</span>{" "}
          {correctPhrase}
        </div>
      ) : null}

      {view === "tutor" && item.expected_topic ? (
        <div className="mt-2 text-xs italic text-emerald-700">topic: {item.expected_topic}</div>
      ) : null}
    </li>
  );
}

export function WordOrderSectionComp({ section, view, theme, sectionIdx = 0 }: Props) {
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
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Example</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {section.example.scrambled.split(/\s+/).map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md border bg-white px-2 py-1 text-sm shadow-sm"
              >
                {w}
              </span>
            ))}
            <span className="mx-2 text-slate-400">→</span>
            <span className="font-medium">{section.example.correct}</span>
            <SpeakButton text={section.example.correct} size="sm" />
          </div>
        </div>
      ) : null}

      <ol className="space-y-3">
        {section.items.map((it, i) => (
          <WordOrderBuilder
            key={i}
            item={it}
            idx={i}
            view={view}
            theme={theme}
            sectionIdx={sectionIdx}
          />
        ))}
      </ol>

      <TutorNotes view={view} instruction={section.tutor_instruction} />
    </SectionCard>
  );
}
