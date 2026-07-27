"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilLine, CheckCircle2, Loader2, Lock, MessageSquareText, XCircle } from "lucide-react";
import { answerMatches, type Homework, type HomeworkQuestion, type HomeworkSubmission } from "@/lib/homework/types";

interface Props {
  homework: Homework;
  submission: HomeworkSubmission | null;
  /** Guests can see the homework exists but must sign in to submit. */
  isLoggedIn: boolean;
  loginHref: string;
}

export function HomeworkPanel({ homework, submission, isLoggedIn, loginHref }: Props) {
  const reviewed = submission?.status === "reviewed";
  const [answers, setAnswers] = useState<string[]>(
    homework.questions.map((_, i) => submission?.answers?.[i]?.answer ?? "")
  );
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(submission?.status === "submitted" || reviewed);

  const locked = !isLoggedIn || reviewed || saving;

  function setAnswer(i: number, v: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  // Self-check tally over the interactive (auto-gradable) questions only.
  const autoQuestions = homework.questions.filter((q) => q.answer && q.type !== "short" && q.type !== "long");
  const correctCount = homework.questions.reduce(
    (n, q, i) => n + (answerMatches(q, answers[i] ?? "") === true ? 1 : 0),
    0
  );

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId: homework.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="homework" className="mx-auto mt-8 max-w-5xl px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/10">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <PencilLine className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-amber-950 dark:text-amber-100">{homework.title}</h2>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Homework · submit to your tutor
            </p>
          </div>
        </div>

        {homework.instructions ? (
          <p className="mb-5 text-sm text-amber-900/90 dark:text-amber-100/80">{homework.instructions}</p>
        ) : null}

        {reviewed && submission?.tutor_feedback ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/15">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-200">
              <MessageSquareText className="h-4 w-4" /> Tutor feedback
            </div>
            <p className="text-emerald-900 dark:text-emerald-100">{submission.tutor_feedback}</p>
          </div>
        ) : null}

        <ol className="space-y-5">
          {homework.questions.map((q, i) => (
            <li key={i}>
              <QuestionInput
                q={q}
                index={i}
                value={answers[i] ?? ""}
                onChange={(v) => setAnswer(i, v)}
                disabled={locked}
                showResult={checked || reviewed}
              />
            </li>
          ))}
        </ol>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!isLoggedIn ? (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <Lock className="h-4 w-4" /> Sign in to do homework
            </Link>
          ) : reviewed ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Reviewed by your tutor
            </span>
          ) : (
            <>
              {autoQuestions.length > 0 ? (
                <button
                  onClick={() => setChecked(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:bg-transparent dark:text-amber-300"
                >
                  Check my answers
                </button>
              ) : null}
              <button
                onClick={submit}
                disabled={saving || answers.every((a) => !a.trim())}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {done ? "Update submission" : "Submit to tutor"}
              </button>
              {checked && autoQuestions.length > 0 ? (
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {correctCount}/{autoQuestions.length} correct so far
                </span>
              ) : done ? (
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Submitted — your tutor will see it.
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function QuestionInput({
  q,
  index,
  value,
  onChange,
  disabled,
  showResult,
}: {
  q: HomeworkQuestion;
  index: number;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  showResult: boolean;
}) {
  const result = showResult ? answerMatches(q, value) : null; // true / false / null

  const label = (
    <div className="mb-1.5">
      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
        {index + 1}. {q.prompt}
      </label>
      {q.prompt_translation ? (
        <p className="text-xs italic text-gray-500 dark:text-gray-400">{q.prompt_translation}</p>
      ) : null}
    </div>
  );

  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-amber-200 disabled:bg-gray-50 disabled:text-gray-500 dark:bg-gray-800 dark:text-white";
  const borderState =
    result === true
      ? "border-emerald-400"
      : result === false
        ? "border-red-400"
        : "border-gray-300 dark:border-gray-600 focus:border-amber-500";

  return (
    <div>
      {label}

      {q.type === "mcq" && q.options ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((opt) => {
            const selected = value === opt;
            const isRight = showResult && q.answer === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                  isRight
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                    : selected
                      ? showResult
                        ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20"
                        : "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
                      : "border-gray-300 bg-white text-gray-800 hover:border-amber-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                {opt}
                {selected ? <span aria-hidden>{showResult ? (isRight ? "✓" : "✗") : "●"}</span> : null}
              </button>
            );
          })}
        </div>
      ) : q.type === "fill_blank" ? (
        <div>
          {q.sentence ? (
            <p className="mb-1.5 text-sm text-gray-700 dark:text-gray-300">
              {q.sentence.split("___")[0]}
              <span className="mx-1 font-semibold text-amber-700">＿＿＿</span>
              {q.sentence.split("___")[1] ?? ""}
            </p>
          ) : null}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Sign in to answer" : "Type the missing word…"}
            className={`${inputBase} ${borderState}`}
          />
        </div>
      ) : q.type === "reorder" && q.options ? (
        <ReorderInput options={q.options} value={value} onChange={onChange} disabled={disabled} state={borderState} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={q.type === "long" ? 4 : 2}
          placeholder={disabled ? "Sign in to answer" : "Your answer…"}
          className={`${inputBase} ${borderState}`}
        />
      )}

      {q.hint ? <p className="mt-1 text-xs text-gray-400">💡 {q.hint}</p> : null}

      {result === false && q.answer ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600">
          <XCircle className="h-3.5 w-3.5" /> Answer: <span className="font-semibold">{q.answer}</span>
        </p>
      ) : result === true ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
        </p>
      ) : null}
    </div>
  );
}

/** Tap tokens to build a sentence; tap a chosen token to remove it. */
function ReorderInput({
  options,
  value,
  onChange,
  disabled,
  state,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  state: string;
}) {
  const chosen = value ? value.split(" ").filter(Boolean) : [];
  // Remaining tokens (respecting duplicates).
  const remaining = [...options];
  for (const c of chosen) {
    const idx = remaining.indexOf(c);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return (
    <div className={`rounded-lg border p-2 ${state}`}>
      <div className="mb-2 min-h-[2.25rem] rounded-md bg-gray-50 px-2 py-1.5 text-sm dark:bg-gray-900">
        {chosen.length ? (
          <div className="flex flex-wrap gap-1.5">
            {chosen.map((tok, i) => (
              <button
                key={`${tok}-${i}`}
                type="button"
                disabled={disabled}
                onClick={() => onChange(chosen.filter((_, j) => j !== i).join(" "))}
                className="rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
              >
                {tok}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs italic text-gray-400">Tap the words in order…</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {remaining.map((tok, i) => (
          <button
            key={`${tok}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange([...chosen, tok].join(" "))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:border-amber-400 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {tok}
          </button>
        ))}
      </div>
    </div>
  );
}
