"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Outcome = {
  email: string;
  status: "granted" | "extended" | "not_found" | "already_paying" | "error";
  endsAt?: string;
  detail?: string;
};

const OUTCOME_LABEL: Record<Outcome["status"], string> = {
  granted: "Granted",
  extended: "Extended",
  not_found: "No account with this email. Ask them to sign up first.",
  already_paying: "Already paying. Skipped.",
  error: "Error",
};

function defaultEnd(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30); // the standard pilot length
  return d.toISOString().slice(0, 10);
}

const input =
  "w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm";

export function GrantForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Outcome[] | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResults(null);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/premium-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: String(f.get("emails") || ""),
          endsAt: String(f.get("endsAt") || ""),
          reason: String(f.get("reason") || ""),
          organization: String(f.get("organization") || ""),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Grant failed");
      setResults(body.results);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grant failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Learner emails (one per line or comma-separated)
        </span>
        <textarea name="emails" rows={4} required className={input} placeholder={"ana@acme.com\nbo@acme.com"} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Organisation</span>
          <input name="organization" className={input} placeholder="Acme Relocation" maxLength={160} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Reason</span>
          <input name="reason" required minLength={3} className={input} defaultValue="30-day pilot" maxLength={300} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Premium until (inclusive)</span>
          <input name="endsAt" type="date" required className={input} defaultValue={defaultEnd()} />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Grant Premium
      </button>

      {results && (
        <ul className="mt-2 divide-y divide-gray-100 border border-gray-100 rounded-lg text-sm">
          {results.map((r) => (
            <li key={r.email} className="px-3 py-2 flex flex-wrap justify-between gap-2">
              <span className="font-mono text-gray-800">{r.email}</span>
              <span
                className={
                  r.status === "granted" || r.status === "extended"
                    ? "text-green-700"
                    : r.status === "error"
                      ? "text-red-600"
                      : "text-amber-700"
                }
              >
                {OUTCOME_LABEL[r.status]}
                {r.endsAt && ` until ${new Date(r.endsAt).toLocaleDateString("en-GB")}`}
                {r.detail && ` (${r.detail})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

export function RevokeButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function revoke() {
    if (!confirm("Revoke this grant? The learner goes back to Free unless something else entitles them.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/premium-grants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || "Revoke failed");
      return;
    }
    router.refresh();
  }
  return (
    <button onClick={revoke} disabled={busy} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
      {busy ? "Revoking…" : "Revoke"}
    </button>
  );
}
