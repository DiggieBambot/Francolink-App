"use client";

// A self-marking exercise, in the landing page's visual language.
//
// Two things kept from the working version rather than the mockup.
//
// Accent tolerance. A naive `answers.includes(input.toLowerCase())` marks
// "achetees" WRONG, which is the single worst thing this page could do: our
// buyers are North Americans on US keyboards, and the demo would fail the
// people it is meant to convince. checkAnswer() accepts the unaccented form,
// marks it correct, and shows the accented spelling.
//
// The reason, always. Right or wrong, the explanation appears -- because the
// whole pitch of the book is that it tells you WHY, and a demo that just says
// "Correct" demonstrates the opposite.

import { useState } from "react";
import { checkAnswer, type Verdict } from "@/lib/workbook/check";

export function WorkbookTry({
  sentenceBefore,
  sentenceAfter,
  hint,
  answers,
  reason,
  compact,
}: {
  sentenceBefore: string;
  sentenceAfter: string;
  hint?: string;
  /** Accepted answers, canonical (accented) first. */
  answers: string[];
  /** Why that is the answer. Shown on both outcomes. */
  reason: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [canonical, setCanonical] = useState("");

  function mark() {
    if (!value.trim()) return;
    const r = checkAnswer(value, { answers });
    setVerdict(r.verdict);
    setCanonical(r.canonical);
  }

  const state =
    verdict === null ? "" : verdict === "incorrect" ? "wrong" : "right";

  return (
    <div>
      <p className={compact ? "try-sentence try-sentence-sm" : "try-sentence"}>
        {sentenceBefore}
        <span className="try-gap">{value ? value : "…"}</span>
        {sentenceAfter}
        {hint && <span className="try-hint"> {hint}</span>}
      </p>

      <div className="try-row">
        <input
          className={`try-input ${state ? `try-input-${state}` : ""}`}
          value={value}
          placeholder="Your answer"
          aria-label={`Answer for: ${sentenceBefore.trim()}`}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => { setValue(e.target.value); setVerdict(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); mark(); } }}
          onBlur={mark}
        />
        <button type="button" className="try-check" onClick={mark}>
          Check
        </button>
      </div>

      {verdict === "correct" && (
        <p role="status" className="try-feedback try-right">
          <strong>✓ Correct.</strong> {reason}
        </p>
      )}
      {verdict === "accent" && (
        <p role="status" className="try-feedback try-accent">
          <strong>✓ Correct</strong> — mind the accent: <strong>{canonical}</strong>. {reason}
        </p>
      )}
      {verdict === "incorrect" && (
        <p role="status" className="try-feedback try-wrong">
          <strong>Not quite — it&apos;s {canonical}.</strong> {reason}
        </p>
      )}
    </div>
  );
}
