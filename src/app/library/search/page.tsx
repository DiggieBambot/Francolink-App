// Search results across all published lessons (title, translation, tags).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { LessonCard } from "@/components/library/lesson-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search | FrancoLink" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const all = await getPublishedLessons();
  const results = query
    ? all.filter((l) => {
        const hay = `${l.title} ${l.title_translation || ""} ${l.topic_tags.join(" ")} ${l.category}`.toLowerCase();
        return hay.includes(query);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link href="/library" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> All materials
          </Link>
          <form action="/library/search" className="mt-4 flex max-w-xl gap-2">
            <input
              name="q"
              defaultValue={q}
              type="text"
              placeholder="Search lessons…"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Search
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-5 text-sm text-slate-600">
          {query ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type a search term above."}
        </p>
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((l) => (
              <LessonCard key={l.id} lesson={l} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
