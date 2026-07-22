"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Send, Copy, Check, ArrowRight } from "lucide-react";
import { OUTREACH_PLATFORMS, OUTREACH_DESTINATIONS } from "@/lib/outreach";

export function OutreachForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ tracked_url: string; tracking_code: string } | null>(null);

  const [platform, setPlatform] = useState<string>("facebook");
  const [targetName, setTargetName] = useState("");
  const [destination, setDestination] = useState("/");
  const [linkDropped, setLinkDropped] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform,
          target_name: targetName,
          destination_path: destination,
          link_dropped: linkDropped,
          notes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
        return;
      }
      setResult({ tracked_url: body.tracked_url, tracking_code: body.tracking_code });
      router.refresh();
    });
  }

  function reset() {
    setResult(null);
    setCopied(false);
    setTargetName("");
    setLinkDropped("");
    setNotes("");
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.tracked_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success state: hand her the tracked link to paste ────────────────────
  if (result) {
    return (
      <div className="space-y-5 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-green-700">Logged ✓</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share <strong>this exact link</strong> — it&apos;s what lets us count the signups you bring in.
          </p>
        </div>

        <div className="rounded-md border bg-muted/40 p-3">
          <p className="break-all font-mono text-sm">{result.tracked_url}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Log another <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/admin/outreach"
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            View all my reports
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="platform" className="mb-1.5 block text-sm font-medium">
            Platform <span className="text-red-500">*</span>
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {OUTREACH_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="destination" className="mb-1.5 block text-sm font-medium">
            Send people to
          </label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {OUTREACH_DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="target" className="mb-1.5 block text-sm font-medium">
          Target community / handle <span className="text-red-500">*</span>
        </label>
        <input
          id="target"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          placeholder="r/FrenchTeachers  ·  Independent Online Language Teachers  ·  @creator"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="link" className="mb-1.5 block text-sm font-medium">
          Link to your comment / post
          <span className="ml-1 font-normal text-muted-foreground">(leave blank for DMs)</span>
        </label>
        <input
          id="link"
          type="url"
          value={linkDropped}
          onChange={(e) => setLinkDropped(e.target.value)}
          placeholder="https://reddit.com/r/.../comment/..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
          Notes / responses
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Teacher asked for conditional-tense games — shared our verb game."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Log outreach &amp; get my link
      </button>
    </form>
  );
}
