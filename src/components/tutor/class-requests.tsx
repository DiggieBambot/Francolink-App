"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";

export interface ClassRequestItem {
  id: string;
  studentName: string;
  message: string | null;
  preferredTime: string | null;
  createdAt: string;
}

export function ClassRequests({ requests }: { requests: ClassRequestItem[] }) {
  const [items, setItems] = useState(requests);
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function resolve(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/tutor/class-requests/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "done" }),
      });
      if (res.ok) setItems((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-900/10">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-amber-950 dark:text-amber-100">
        <CalendarClock className="h-5 w-5" /> Class requests
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{items.length}</span>
      </h2>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white">{r.studentName}</p>
              {r.preferredTime ? (
                <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">When:</span> {r.preferredTime}</p>
              ) : null}
              {r.message ? <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">“{r.message}”</p> : null}
            </div>
            <button
              onClick={() => resolve(r.id)}
              disabled={busy === r.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Mark handled
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
