// Search results across all published lessons (title, translation, tags).

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { LessonCard } from "@/components/library/lesson-card";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui";

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
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-100 bg-white">
          <Container className="max-w-6xl py-8">
            <Link href="/library" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> All materials
            </Link>
            <form action="/library/search" className="mt-4 flex max-w-xl gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 shadow-soft focus-within:border-primary-400">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  type="text"
                  placeholder="Search lessons…"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button type="submit" className="rounded-xl bg-secondary px-6 py-3 text-sm font-heading font-semibold text-white shadow-soft transition hover:bg-secondary-600">
                Search
              </button>
            </form>
          </Container>
        </header>

        <Container className="max-w-6xl py-8">
          <p className="mb-5 text-sm font-medium text-gray-600">
            {query ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type a search term above."}
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          ) : null}
        </Container>
      </div>
    </PublicShell>
  );
}
