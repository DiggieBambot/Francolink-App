"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Check, Loader2, Users } from "lucide-react";

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  slug: string;
  homeworkTitle: string;
  students: Student[];
  alreadyAssignedIds: string[];
}

export function HomeworkSendPanel({ slug, homeworkTitle, students, alreadyAssignedIds }: Props) {
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
