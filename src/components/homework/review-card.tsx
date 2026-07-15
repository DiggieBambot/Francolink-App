"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import type { HomeworkQuestion } from "@/lib/homework/types";

export interface ReviewItem {
  submissionId: string;
  studentName: string;
  lessonTitle: string;
  lessonSlug: string;
  status: "submitted" | "reviewed";
  submittedAt: string;
  feedback: string | null;
  questions: HomeworkQuestion[];
  answers: string[];
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [status, setStatus] = useState(item.status);
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function markReviewed() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/homework/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: item.submissionId, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setStatus("reviewed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{item.studentName}</p>
          <Link
            href={`/library/lesson/${item.lessonSlug}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {item.lessonTitle} <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            status === "reviewed"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          }`}
        >
          {status === "reviewed" ? "Reviewed" : "Awaiting review"}
        </span>
      </div>

      <ol className="mb-4 space-y-3">
        {item.questions.map((q, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {i + 1}. {q.prompt}
            </p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
              {item.answers[i]?.trim() || <span className="italic text-gray-400">No answer</span>}
            </p>
          </li>
        ))}
      </ol>

      {status === "reviewed" ? (
        feedback ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/15 dark:text-emerald-100">
            <span className="font-semibold">Your feedback: </span>
            {feedback}
          </div>
        ) : null
      ) : (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Optional feedback for your student…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            onClick={markReviewed}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Mark reviewed
          </button>
        </div>
      )}
    </div>
  );
}
