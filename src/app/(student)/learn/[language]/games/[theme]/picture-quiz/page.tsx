import PictureQuiz from "@/components/games/picture-quiz";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function PictureQuizPage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <PictureQuiz language={language} theme={theme} />;
}
