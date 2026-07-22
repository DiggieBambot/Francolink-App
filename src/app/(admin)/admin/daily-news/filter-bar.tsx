"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const CATEGORIES = ["technology", "health", "sports", "entertainment", "world", "science"];

export function DailyNewsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lang = searchParams.get("lang") || "";
  const category = searchParams.get("category") || "";

  function update(next: { lang?: string; category?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextLang = next.lang !== undefined ? next.lang : lang;
    const nextCategory = next.category !== undefined ? next.category : category;
    if (nextLang) params.set("lang", nextLang);
    else params.delete("lang");
    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Filter:</span>

      <div className="flex overflow-hidden rounded-md border text-xs font-semibold">
        <button
          type="button"
          onClick={() => update({ lang: "" })}
          className={`px-2.5 py-1 ${lang === "" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => update({ lang: "en" })}
          className={`px-2.5 py-1 ${lang === "en" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}
        >
          🇬🇧 EN
        </button>
        <button
          type="button"
          onClick={() => update({ lang: "fr" })}
          className={`px-2.5 py-1 ${lang === "fr" ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}
        >
          🇫🇷 FR
        </button>
      </div>

      <select
        value={category}
        onChange={(e) => update({ category: e.target.value })}
        className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c[0].toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>

      {(lang || category) && (
        <button
          type="button"
          onClick={() => update({ lang: "", category: "" })}
          className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
