import MemoryMatch from "@/components/games/memory-match";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function MemoryMatchPage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <MemoryMatch language={language} theme={theme} />;
}
