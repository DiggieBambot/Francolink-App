"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Undo2 } from "lucide-react";

type Status = "draft" | "review" | "published" | "rejected";

export function LessonStatusActions({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function change(next: Status) {
    setErr(null);
    start(async () => {
      const res = await fetch(`/api/admin/tutor-lessons/${id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body.error || `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status !== "published" ? (
          <button
            onClick={() => change("published")}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Publish
          </button>
        ) : null}
        {status !== "rejected" ? (
          <button
            onClick={() => change("rejected")}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        ) : null}
        {status !== "review" ? (
          <button
            onClick={() => change("review")}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" /> Back to review
          </button>
        ) : null}
      </div>
      {err ? <p className="text-xs text-rose-700">{err}</p> : null}
    </div>
  );
}
