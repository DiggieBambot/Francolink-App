"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export function BulkPublishButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function publishAll() {
    if (!confirm(`Publish all ${count} lessons currently in Review? They'll become visible to tutors.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/tutor-lessons/bulk-publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: "review" }),
      });
      const body = await res.json();
      if (!res.ok) setMsg(`✗ ${body.error || res.status}`);
      else {
        setMsg(`✓ Published ${body.published}`);
        router.refresh();
      }
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={publishAll}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {busy ? "Publishing…" : `Publish all ${count} in Review`}
      </button>
      {msg ? <span className="text-xs text-slate-500">{msg}</span> : null}
    </div>
  );
}
