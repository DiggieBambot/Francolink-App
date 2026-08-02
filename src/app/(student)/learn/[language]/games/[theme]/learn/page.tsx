// src/app/(student)/learn/[language]/games/[theme]/learn/page.tsx
//
// Flashcard primer: after a child picks a theme, they see the theme's words as
// flip cards (with pronunciation) before choosing a game. A "Play games" CTA
// and "Skip" link both lead to the game picker at /learn/[lang]/games/[theme].

import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";
import FlashcardPrimer from "@/components/games/flashcard-primer";

export default async function PrimerPage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <FlashcardPrimer language={language} theme={theme} />;
}
