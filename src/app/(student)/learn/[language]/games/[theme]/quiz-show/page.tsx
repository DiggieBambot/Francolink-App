import QuizShow from "@/components/games/quiz-show";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/games/themes";

export default async function QuizShowPage({ params }: { params: Promise<{ language: string; theme: string }> }) {
  const { language, theme } = await params;
  if (!themeBySlug(theme)) return notFound();
  return <QuizShow language={language} theme={theme} />;
}
