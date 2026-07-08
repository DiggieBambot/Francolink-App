import WordRace from "@/components/games/word-race";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function WordRacePage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <WordRace language={language} theme={theme} />;
}
