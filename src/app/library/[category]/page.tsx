// Category page: lessons in one category, filterable by CEFR level.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { CATEGORY_BY_SLUG } from "@/lib/lessons/categories";
import { sortForCategory } from "@/lib/lessons/syllabus-order";
import { CategoryLessons } from "@/components/library/category-lessons";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui";

export const revalidate = 300;

// Prebuild every known category page at build time (fixed taxonomy).
export function generateStaticParams() {
  return Object.keys(CATEGORY_BY_SLUG).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = CATEGORY_BY_SLUG[category];
  return {
    title: cat ? `${cat.name} | FrancoLink` : "Lessons | FrancoLink",
    // Canonicalise the ?level= filter variants back to the base category URL
    // so Google doesn't treat each filter as duplicate content.
    alternates: { canonical: `/library/${category}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = CATEGORY_BY_SLUG[category];
  if (!cat) notFound();

  const all = await getPublishedLessons();
  const inCat = sortForCategory(
    all.filter((l) => l.category === category),
    category
  );
  const cover = inCat.find((l) => l.hero_image_url)?.hero_image_url;

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        {/* Photo banner */}
        <header className="relative overflow-hidden">
          <div className={`relative h-56 w-full bg-gradient-to-br sm:h-64 ${cat.gradient}`}>
            {cover ? (
              <Image src={cover} alt={cat.name} fill priority sizes="100vw" className="object-cover" />
            ) : cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- local SVG banner, no optimizer needed
              <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/50 to-primary-900/20" />
            <Container className="absolute inset-x-0 bottom-0 max-w-6xl pb-7">
              <Link href="/library" className="inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> All materials
              </Link>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-5xl drop-shadow">{cat.emoji}</span>
                <div>
                  <h1 className="font-heading text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">{cat.name}</h1>
                  <p className="mt-1 max-w-xl text-sm text-white/85">{cat.description}</p>
                </div>
              </div>
            </Container>
          </div>
        </header>

        <Container className="max-w-6xl py-8">
          <CategoryLessons lessons={inCat} category={category} />
        </Container>
      </div>
    </PublicShell>
  );
}
