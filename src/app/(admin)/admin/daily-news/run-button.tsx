"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Newspaper, Loader2 } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "technology", label: "Tech" },
  { value: "health", label: "Health" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
  { value: "world", label: "World" },
  { value: "science", label: "Science" },
];

export function RunDailyNewsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  // Empty = all categories (existing default behavior).
  const [categories, setCategories] = useState<Set<string>>(new Set());

  function toggleCategory(value: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cron/daily-news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dryRun: false,
          language,
          ...(categories.size ? { categories: Array.from(categories) } : {}),
        }),
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
      <div className="flex overflow-hidden rounded-md border text-xs font-semibold">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-2.5 py-1 ${language === "en" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}
        >
          🇬🇧 EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("fr")}
          className={`px-2.5 py-1 ${language === "fr" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}
        >
          🇫🇷 FR
        </button>
      </div>

      <div className="flex max-w-xs flex-wrap justify-end gap-1">
        {CATEGORIES.map((c) => {
          const active = categories.has(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleCategory(c.value)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {categories.size ? `${categories.size} categor${categories.size === 1 ? "y" : "ies"} selected` : "All categories"}
      </p>

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
