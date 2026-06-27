import PictureQuiz from "@/components/games/picture-quiz";

export default async function PictureQuizPage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  return <PictureQuiz language={language} />;
}
