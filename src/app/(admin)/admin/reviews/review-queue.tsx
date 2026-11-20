"use client";

import { useState } from "react";
import { Star, Check, X } from "lucide-react";

export interface QueueReview {
  id: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  student: string;
  tutor: string;
}

const TABS = ["pending", "approved", "rejected"] as const;

export function ReviewQueue({ initial }: { initial: QueueReview[] }) {
  const [reviews, setReviews] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Couldn't save that decision.");
        return;
      }
      setReviews((rs) =>
        rs.map((r) => (r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r))
      );
    } finally {
      setBusy(null);
    }
  }

  const shown = reviews.filter((r) => r.status === tab);

  return (
    <>
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize ${
              tab === t ? "bg-primary text-white" : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {t} ({reviews.filter((r) => r.status === t).length})
          </button>
        ))}
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
          Nothing {tab}.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
          {shown.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-sm text-gray-800">{r.comment || <em className="text-gray-400">No comment</em>}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {r.student} about <b>{r.tutor}</b> · {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.status !== "approved" && (
                  <button
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, "approve")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    disabled={busy === r.id}
                    onClick={() => decide(r.id, "reject")}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> {r.status === "approved" ? "Unpublish" : "Reject"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
