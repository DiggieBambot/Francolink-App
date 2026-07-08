import MazeChase from "@/components/games/maze-chase";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function MazeChasePage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <MazeChase language={language} theme={theme} />;
}
