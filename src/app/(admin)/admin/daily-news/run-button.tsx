"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Newspaper, Loader2 } from "lucide-react";

export function RunDailyNewsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cron/daily-news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(body.error || body.errors?.[0] || `HTTP ${res.status}`);
        return;
      }
      setMessage(`Generated ${body.generated || 0} draft lesson${body.generated === 1 ? "" : "s"}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
        Generate today&apos;s news
      </button>
      {message ? <p className="max-w-xs text-right text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
