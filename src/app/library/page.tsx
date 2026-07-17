// Public lesson catalogue — clean & premium category grid. Guest-accessible.

import { Search } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { GuestCTA } from "@/components/library/guest-cta";
import { PublicShell } from "@/components/layout/public-shell";
import { Container, Eyebrow } from "@/components/ui";
import { LibraryBrowser, type BrowserLesson } from "@/components/library/library-browser";

// Fully static/ISR: the page reads no request-time data — language and level
// filtering happen client-side in LibraryBrowser. New/edited lessons appear
// within the revalidate window.
export const revalidate = 300;
export const metadata = {
  title: "Lesson Materials | FrancoLink",
  description: "Free lesson materials — French & English. Search by level or topic.",
};

export default async function LibraryPage() {
  const lessons = await getPublishedLessons();

  const browserLessons: BrowserLesson[] = lessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    title_translation: l.title_translation,
    level: l.level,
    language: l.language,
    category: l.category,
    hero_image_url: l.hero_image_url,
    duration_minutes: l.duration_minutes,
    section_count: l.section_count,
  }));

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        <GuestCTA />

        {/* Header / hero (static) */}
        <header className="border-b border-gray-100 bg-white">
          <Container className="max-w-5xl py-14 text-center">
            <Eyebrow>Lesson Library</Eyebrow>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
              Lesson Materials
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
              Free to browse — search by level or interest, then study live with a tutor for the full
              experience.
            </p>

            {/* Search */}
            <form action="/library/search" className="mx-auto mt-8 flex max-w-xl gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 shadow-soft focus-within:border-primary-400">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  name="q"
                  type="text"
                  placeholder="e.g. business, travel, family…"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-secondary px-6 py-3 text-sm font-heading font-semibold text-white shadow-soft transition hover:bg-secondary-600 hover:shadow-medium"
              >
                Search
              </button>
            </form>
          </Container>
        </header>

        {/* Language tabs + level filter + category grid (all client-side) */}
        <LibraryBrowser lessons={browserLessons} />
      </div>
    </PublicShell>
  );
}
