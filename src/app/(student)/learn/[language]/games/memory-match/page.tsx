import MemoryMatch from "@/components/games/memory-match";

export default async function MemoryMatchPage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  return <MemoryMatch language={language} />;
}
