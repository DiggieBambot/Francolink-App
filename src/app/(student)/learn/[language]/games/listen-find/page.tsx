import ListenAndFind from "@/components/games/listen-find";

export default async function ListenFindPage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  return <ListenAndFind language={language} />;
}
