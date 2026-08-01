"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Check, Loader2, Users, Eye, ChevronDown } from "lucide-react";
import type { HomeworkQuestion } from "@/lib/homework/types";

const TYPE_LABEL: Record<HomeworkQuestion["type"], string> = {
  fill_blank: "fill the blank",
  mcq: "multiple choice",
  reorder: "word order",
  short: "short written",
  long: "written",
};

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  slug: string;
  homeworkTitle: string;
  instructions?: string | null;
  questions?: HomeworkQuestion[];
  students: Student[];
  alreadyAssignedIds: string[];
}

export function HomeworkSendPanel({ slug, homeworkTitle, instructions, questions = [], students, alreadyAssignedIds }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [assigned, setAssigned] = useState<Set<string>>(new Set(alreadyAssignedIds));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [justSent, setJustSent] = useState(0);

  function toggle(id: string) {
    if (assigned.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function send() {
    if (selected.size === 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/homework/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, studentIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send");
      setAssigned((prev) => new Set([...prev, ...selected]));
      setJustSent(data.assigned || selected.size);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl px-6">
      <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-6 shadow-sm dark:border-primary-800 dark:bg-primary-900/10">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <Send className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-primary-950 dark:text-primary-100">Send homework</h2>
        </div>
        <p className="mb-4 text-sm text-primary-900/80 dark:text-primary-100/70">
          Assign <span className="font-semibold">{homeworkTitle}</span> to your students. They&apos;ll get a
          notification to complete it, and their answers come back to your Homework tab.
        </p>

        {/* Preview: what the student will see. */}
        {questions.length > 0 ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-primary-100 bg-white dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-50/50 dark:text-primary-200 dark:hover:bg-gray-700/40"
            >
              <span className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" /> Preview homework ({questions.length} question{questions.length === 1 ? "" : "s"})
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showPreview ? "rotate-180" : ""}`} />
            </button>
            {showPreview ? (
              <div className="border-t border-primary-100 px-4 py-3 dark:border-gray-700">
                {instructions ? (
                  <p className="mb-3 text-sm italic text-gray-500 dark:text-gray-400">{instructions}</p>
                ) : null}
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  This is the full exercise with the answer key — students never see the answers.
                </p>
                <ol className="space-y-4">
                  {questions.map((q, i) => (
                    <li key={i} className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {i + 1}. {q.prompt}
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                          {TYPE_LABEL[q.type]}
                        </span>
                      </p>
                      {q.prompt_translation ? (
                        <p className="text-xs italic text-gray-400">{q.prompt_translation}</p>
                      ) : null}

                      {q.sentence ? (
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {q.sentence.split("___")[0]}
                          <span className="mx-1 font-semibold text-primary">＿＿＿</span>
                          {q.sentence.split("___")[1] ?? ""}
                        </p>
                      ) : null}

                      {q.type === "mcq" && q.options ? (
                        <ul className="mt-1.5 space-y-1">
                          {q.options.map((opt) => {
                            const right = opt === q.answer;
                            return (
                              <li
                                key={opt}
                                className={`rounded-md px-2 py-1 text-xs ${
                                  right
                                    ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {right ? "✓ " : "• "}
                                {opt}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}

                      {q.type === "reorder" && q.options ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {q.options.map((tok, j) => (
                            <span
                              key={`${tok}-${j}`}
                              className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                              {tok}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {q.hint ? <p className="mt-1 text-xs text-gray-400">💡 {q.hint}</p> : null}

                      {q.answer ? (
                        <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Answer: {q.answer}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-gray-400">Written answer — you grade this one.</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        {students.length === 0 ? (
          <p className="rounded-lg bg-white/70 px-4 py-3 text-sm text-gray-600 dark:bg-gray-800/40 dark:text-gray-300">
            You have no connected students yet.{" "}
            <Link href="/tutor/students" className="font-semibold text-primary hover:underline">
              Share your invite link
            </Link>{" "}
            to add some.
          </p>
        ) : (
          <>
            <div className="mb-4 divide-y divide-primary-100 overflow-hidden rounded-xl border border-primary-100 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
              {students.map((s) => {
                const isAssigned = assigned.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      isAssigned ? "opacity-70" : "cursor-pointer hover:bg-primary-50/50 dark:hover:bg-gray-700/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      checked={isAssigned || selected.has(s.id)}
                      disabled={isAssigned}
                      onChange={() => toggle(s.id)}
                    />
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      {s.name || s.email}
                    </span>
                    {isAssigned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Sent
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            {justSent > 0 ? (
              <p className="mb-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Sent to {justSent} student{justSent === 1 ? "" : "s"}. They&apos;ve been notified.
              </p>
            ) : null}

            <button
              onClick={send}
              disabled={sending || selected.size === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Send to {selected.size || "selected"} student{selected.size === 1 ? "" : "s"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
