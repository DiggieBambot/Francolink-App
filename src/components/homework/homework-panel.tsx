"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilLine, CheckCircle2, Loader2, Lock, MessageSquareText } from "lucide-react";
import type { Homework, HomeworkSubmission } from "@/lib/homework/types";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(submission?.status === "submitted" || reviewed);

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
              Optional homework
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
              <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                {i + 1}. {q.prompt}
              </label>
              {q.prompt_translation ? (
                <p className="mb-1.5 text-xs italic text-gray-500 dark:text-gray-400">{q.prompt_translation}</p>
              ) : null}
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                disabled={!isLoggedIn || reviewed || saving}
                rows={q.type === "long" ? 4 : 2}
                placeholder={isLoggedIn ? "Your answer…" : "Sign in to answer"}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {q.hint ? <p className="mt-1 text-xs text-gray-400">💡 {q.hint}</p> : null}
            </li>
          ))}
        </ol>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 flex items-center gap-3">
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
              <button
                onClick={submit}
                disabled={saving || answers.every((a) => !a.trim())}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {done ? "Update submission" : "Submit homework"}
              </button>
              {done ? (
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
