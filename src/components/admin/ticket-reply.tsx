"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export function TicketReply({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function send(closeToo = false) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, status: closeToo ? "resolved" : status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBody("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(next: string) {
    setStatus(next);
    setSaving(true);
    try {
      await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Status:</span>
        {["open", "pending", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            disabled={saving}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition ${
              status === s ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary-200"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => send(false)}
          disabled={saving || !body.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reply
        </button>
        <button
          onClick={() => send(true)}
          disabled={saving || !body.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" /> Reply & resolve
        </button>
      </div>
    </div>
  );
}
