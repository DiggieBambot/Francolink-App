"use client";

// One self-marking exercise. Used on the sales page as a live demo and, later,
// throughout the reader — the same component both times, so what a prospect
// tries is literally the product.
//
// Marking happens on Enter or on blur, not on every keystroke: telling someone
// they are wrong while they are still typing the first letter is hostile.

import { useState } from "react";
import { checkAnswer, feedbackFor, type Blank, type Verdict } from "@/lib/workbook/check";
import { Check, X, Info } from "lucide-react";

export interface ExerciseItem {
  /** Sentence with `___` marking the blank. */
  prompt: string;
  blank: Blank;
  /** Optional hint shown after the sentence, e.g. "(commencer)". */
  cue?: string;
}

export function Exercise({
  title,
  items,
  onAttempt,
}: {
  title: string;
  items: ExerciseItem[];
  onAttempt?: (index: number, verdict: Verdict) => void;
}) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-5 sm:p-6">
      <p className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">
        {title}
      </p>
      <ol className="space-y-4">
        {items.map((item, i) => (
          <Item key={i} item={item} index={i} onAttempt={onAttempt} />
        ))}
      </ol>
    </div>
  );
}

function Item({
  item, index, onAttempt,
}: {
  item: ExerciseItem;
  index: number;
  onAttempt?: (index: number, verdict: Verdict) => void;
}) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [message, setMessage] = useState("");

  function mark() {
    if (!value.trim()) return;
    const result = checkAnswer(value, item.blank);
    setVerdict(result.verdict);
    setMessage(feedbackFor(result));
    onAttempt?.(index, result.verdict);
  }

  const [before, after] = item.prompt.split("___");
  const ok = verdict === "correct" || verdict === "accent";

  const ring =
    verdict === null
      ? "border-gray-300 focus:border-primary"
      : ok
      ? "border-emerald-500 bg-emerald-50"
      : "border-red-400 bg-red-50";

  return (
    <li className="text-[15px] leading-relaxed">
      <span>{before}</span>
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); setVerdict(null); }}
        onBlur={mark}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); mark(); } }}
        aria-label={`Answer ${index + 1}`}
        className={`mx-1 w-36 rounded-md border-2 px-2 py-1 text-[15px] outline-none transition-colors ${ring}`}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <span>{after}</span>
      {item.cue && <span className="ml-1 italic text-gray-500">{item.cue}</span>}

      {verdict && (
        <p
          role="status"
          className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${
            verdict === "correct"
              ? "text-emerald-700"
              : verdict === "accent"
              ? "text-amber-700"
              : "text-red-600"
          }`}
        >
          {verdict === "correct" ? (
            <Check className="h-4 w-4" />
          ) : verdict === "accent" ? (
            <Info className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {message}
        </p>
      )}
    </li>
  );
}
